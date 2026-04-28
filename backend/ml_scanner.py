import torch
from torchvision import models, transforms
from PIL import Image
import io

# 1. Change to 2 categories instead of 4
CLASSES = ["COVID-19", "Normal"]

# 2. Build the empty DenseNet-121 skeleton
model = models.densenet121()
num_ftrs = model.classifier.in_features

# CHANGE THIS LINE: Change the 4 to a 2!
model.classifier = torch.nn.Linear(num_ftrs, 2)



# 3. Load your downloaded weights, FORCED onto the laptop's CPU!
# (If this line throws a size error, let me know instantly, it just means the tutorial used 3 classes instead of 4)
model.load_state_dict(torch.load('hackathon_model.pth', map_location=torch.device('cpu')))
model.eval() # Turn off training mode

# 4. Standard formatting rules so the AI can read the image
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def analyze_image(image_bytes):
    # Open the image file that React sends us
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    input_tensor = transform(img).unsqueeze(0) 

    # Run the math!
    with torch.no_grad():
        output = model(input_tensor)
        
        # Calculate the confidence percentages
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        top_score, top_class_idx = torch.max(probabilities, 0)
        
        disease_name = CLASSES[top_class_idx.item()]
        confidence = round(top_score.item() * 100, 2)
        
    return {
        "disease_detected": disease_name,
        "confidence_score": confidence
    }