import os
import csv
from csv import DictWriter
from PIL import Image, ImageStat
from stats import *


def load_existing_data(filename='images.csv'):
    """
    Loads existing image data from the images.csv file into a dictionary for quick lookup.
    """
    data_cache = {}
    output_path = os.path.join('data', filename)
    if os.path.exists(output_path):
        print(f"Found existing data file: {output_path}. Loading cached values...")
        with open(output_path, 'r', encoding='utf-8') as csvin:
            reader = csv.DictReader(csvin)
            for row in reader:
                # Use 'Nummer' as the unique key for the cache
                if 'Nummer' in row and row['Nummer']:
                    data_cache[int(row['Nummer'])] = row
        print("--- Cache loaded ---")
    return data_cache

def list_files(dir, existing_data_cache):
    r = {}
    all_files = []
    for root, dirs, files in os.walk(dir):
        if 'thumb' in root:
            continue
        dirs.sort()
        for name in files:
            if not name.startswith('.'):
                all_files.append(os.path.join(root, name))

    total_files = len(all_files)
    print(f"Found {total_files} files to process.")

    for index, file_path in enumerate(all_files, start=1):
        root, name = os.path.split(file_path)
        fn, ext = os.path.splitext(name)
        try:
            wn = int(fn.split('_')[0].split(' ')[0].split(',')[0].strip('.+jpg'))
        except (ValueError, IndexError):
            print(f"Invalid file name format, skipping: {file_path}")
            continue

        # Check if data exists in the cache
        cached_data = existing_data_cache.get(wn)
        
        # Assume values are cached if they are not None or empty strings
        if cached_data and cached_data.get('brightness') and cached_data.get('hue') and cached_data.get('saturation'):
            brightness = int(cached_data['brightness'])
            hue = int(cached_data['hue'])
            saturation = int(cached_data['saturation'])
        else:
            # If data is not cached, calculate it
            try:
                brightness = calculate_brightness(file_path)
                hue = calculate_hue(file_path)
                saturation = calculate_saturation(file_path)
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                brightness = None
                hue = None
                saturation = None

        r[wn] = {
            'path': file_path.strip('./'),
            'thumb': os.path.join(root, 'thumb', name).strip('./'),
            'brightness': brightness,
            'hue': hue,
            'saturation': saturation
        }

        # Print progress
        progress = (index / total_files) * 100
        print(f"Processed {index}/{total_files} files ({progress:.2f}%)", end="\r")

    print("\n--- File processing complete ---")
    return r

def calculate_brightness(image_path):
    """
    Calculate the average brightness of an image.
    """
    with Image.open(image_path) as img:
        img = img.convert("L")  # Convert image to grayscale
        stat = ImageStat.Stat(img)
        normalized_brightness = (stat.mean[0] / 255) * 100  # Normalize to 0-100
        return round(normalized_brightness)

def calculate_hue(image_path):
    """
    Calculate the average hue of an image.
    """
    with Image.open(image_path) as img:
        img = img.convert("RGB")  # Ensure the image is in RGB mode
        img = img.convert("HSV")  # Convert to HSV
        hue_values = [pixel[0] for pixel in img.getdata()]  # Extract the hue channel
        normalized_hues = [(hue / 255) * 360 for hue in hue_values]  # Normalize to 0-360
        return round(sum(normalized_hues) / len(normalized_hues)) # Rounded average hue
    
def calculate_saturation(image_path):
    """
    Calculate the average saturation of an image.
    Normalizes the saturation values to range from 0 to 100.
    """
    with Image.open(image_path) as img:
        img = img.convert("RGB")  # Ensure the image is in RGB mode
        img = img.convert("HSV")  # Convert to HSV
        saturation_values = [pixel[1] for pixel in img.getdata()]  # Extract the saturation channel
        normalized_saturations = [(saturation / 255) * 100 for saturation in saturation_values]  # Normalize to 0-100
        return round(sum(normalized_saturations) / len(normalized_saturations))

def flatten(xss):
    return [x for xs in xss for x in xs]

def normalize_title(title):
    import unicodedata
    if not title:
        return ""
    title = unicodedata.normalize('NFD', title).encode('ascii', 'ignore').decode('utf-8')
    title = title.translate(str.maketrans("", "", ".-…\"'«»“”()[]{}&"))
    title = title.replace("...", " ").replace("…", " ")
    return title.strip().lower()

def update_files(lf, filename='WERKVERZEICHNIS.csv', outputfile='images.csv'):
    with open(os.path.join('data', filename), 'r') as csvin:
        reader = csv.DictReader(csvin)
        fieldnames = reader.fieldnames

        # Ensure new columns exist
        if 'path' not in fieldnames: fieldnames.append('path')
        if 'thumb' not in fieldnames: fieldnames.append('thumb')
        if 'TitelEinfach' not in fieldnames: fieldnames.append('TitelEinfach')  # Add normalized title column
        if 'brightness' not in fieldnames: fieldnames.append('brightness')  # Add brightness column
        if 'hue' not in fieldnames: fieldnames.append('hue')  # Add hue column
        if 'saturation' not in fieldnames: fieldnames.append('saturation')  # Add saturation column

        fieldnames.append('Techniken')
        fieldnames.append('Motiven')
        fieldnames.append('Darstellungsformen')

        outputpath = os.path.join('data', outputfile)
        print("Writing to %s" % outputpath)

        with open(outputpath, 'w+') as csvout:
            writer = csv.DictWriter(csvout, fieldnames=fieldnames,
                                     delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()

            print('Scanning images, showing any missing below:')
            for r in reader:
                try:
                    imagerow = lf[int(r['Nummer'])]
                except:
                    print(r['Nummer'], end=' ')
                    continue

                # Add paths and brightness
                r['path'] = imagerow['path']
                r['thumb'] = imagerow['thumb']
                r['brightness'] = imagerow['brightness']
                r['hue'] = imagerow['hue']
                r['saturation'] = imagerow['saturation']

                # Add normalized title
                if 'Titel' in r:
                    r['TitelEinfach'] = normalize_title(r['Titel'])

                # Process other fields
                r['Techniken'] = ' '.join([
                    r['Technik'],
                    r['Technik I'],
                    r['Technik II'],
                    r['Technik III'],
                    r['Technik IV'],
                ])

                r['Technik'] = r['Technik'].replace('FoD', 'Fo').replace('FoP', 'Fo')

                r['Motiven'] = ' '.join(flatten([
                    r['Motiv I'].split(", "),
                    r['Motiv II'].split(", "),
                    r['Motiv III'].split(", "),
                    r['Motiv IV'].split(", "),
                ]))

                r['Darstellungsformen'] = ' '.join([
                    r['Darstellungsform'],
                    r['Darstellungsform I'],
                ])

                r['Jahr'] = r['Jahr'].strip().strip('a')

                writer.writerow(r)

            print("--- Done.")

if __name__ == '__main__':
    existing_data = load_existing_data()
    lf = list_files('images', existing_data)
    update_files(lf)
    update_stats()