import os
import requests
import concurrent.futures
import time

# Create directory for background images if it doesn't exist
output_dir = "C:/USers/Shibedev12/documents/intellistar-emulator-master/assets/backgrounds"
os.makedirs(output_dir, exist_ok=True)

# Base URL for Picsum photos
base_url = "https://picsum.photos/1920/1080"

# Number of images to download
num_images = 500

def download_image(index):
    """Download a single image with a random seed"""
    try:
        # Add blur and random parameter to ensure we get unique images
        url = f"{base_url}?blur=5&random={index}"
        
        # Print status
        print(f"Downloading image {index}/{num_images}...")
        
        # Send request
        response = requests.get(url, stream=True, timeout=10)
        
        if response.status_code == 200:
            # Save the image
            filename = f"{output_dir}/bg_{index:03d}.jpg"
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024):
                    f.write(chunk)
            
            print(f"✓ Downloaded image {index}/{num_images}")
            return True
        else:
            print(f"✗ Failed to download image {index}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error downloading image {index}: {str(e)}")
        return False

def main():
    print(f"Starting download of {num_images} background images to {output_dir}")
    
    # Record start time
    start_time = time.time()
    
    # Use ThreadPoolExecutor for parallel downloads
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        # Submit all download tasks
        futures = [executor.submit(download_image, i) for i in range(1, num_images+1)]
        
        # Wait for all downloads to complete
        results = [future.result() for future in concurrent.futures.as_completed(futures)]
    
    # Calculate statistics
    successful = results.count(True)
    elapsed_time = time.time() - start_time
    
    print(f"\nDownload complete! {successful}/{num_images} images downloaded successfully")
    print(f"Total time: {elapsed_time:.2f} seconds")
    
    # Add instructions on how to use these images in the emulator
    print("\nTo use these images in the emulator:")
    print("1. Open js/MainScript.js")
    print("2. Find the setMainBackground() function")
    print("3. Replace the picsum.photos URL with code that selects a random local image")
    print("4. Example code snippet to add:")
    print("""
    function setMainBackground() {
      var imageIndex = Math.floor(Math.random() * 100) + 1;
      var paddedIndex = imageIndex.toString().padStart(3, '0');
      var imageUrl = 'assets/backgrounds/bg_' + paddedIndex + '.jpg';
      getElement('background-image').style.backgroundImage = 'url(' + imageUrl + ')';
    }
    """)

if __name__ == "__main__":
    main()
