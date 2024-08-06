# Panoptikum

This is a web application that converts CSV files to an API with search and filtering. It has been used to create a digital collection of artworks, but could be used for essentially any data that is described using a [Data Package](http://frictionlessdata.io/specs/data-package/#specification). Find out more on the [Open Knowledge Blog](https://blog.okfn.org/2019/05/09/panoptikum-exploring-new-ways-to-categorize-a-collection-of-various-unusual-and-unique-objects/).

Made with [Frictionless Data](https://frictionlessdata.io), [Flask](http://flask.pocoo.org/), [Bootstrap](https://getbootstrap.com) and [LightGallery](https://www.lightgalleryjs.com/).


## Prerequisites
Before starting with the deployment, ensure you have the following installed:

- Python 3.8
- pip and virtualenv
- ImageMagick (for image processing)
- NumPy

## Installation 
Install Python 3.8 and using:

```
sudo apt-get install python3.8 python3-numpy
```

## Development

 1. Set up the environment using pipenv:
      ```
      python3 -m pip install pipenv
      pipenv --python 3
      pipenv shell
      pipenv sync
      ```

2. Alternatively, use virtualenv:
    ```
    virtualenv --system-site-packages -p python3.8 env
    source env/bin/activate
    pip install -r requirements.txt
    ```

3. Running the Application:
- For development
  ```
  env FLASK_DEBUG=1 flask run
  ```


- For production, use Gunicorn or a similar WSGI server:
  ```
  gunicorn --log-level=info -w 4 -b :8000 app:app
  ```

## Deployment
Changes to the github are automatically deployed.
Visit https://bildarchiv-js.ch/ to verify that the update was succesful.

## Update data

To add new images into the collection and ensure the metadata is up to date, follow these steps:

1. Save `WERKVERZEICHNIS.csv`:

    Open the new `WERKVERZEICHNIS.xlsx` in Calc and save as CSV, using `UTF-8` as
    encoding, `,` as delimiter, `"` as quotation and enabling
    `quote all text cells`. This should produce a file `WERKVERZEICHNIS.csv`.
    It's suggested to save the old version as a duplicate.

2. Download all existing images (check username): 

    `rsync -azP root@cloud.juergstraumann.ch:/var/lib/dokku/data/storage/archiv/images/ ./images/`
3. Place any new image files in the `IMPORT` folder and rename them to `WV_neu_$date_ersatz` or `WV_neu_$date`
4. Remove metadata from images:

    Make sure you are in the `IMPORT` folder and run `find . -name '.*_*' | xargs -d '\n' rm` or alternatively `exiftool -all= *.jpg`, `exiftool -all= *.png`

5. Rename the newly imported folders with increasing numbers.
6. Crop and resize the images by running `./convert.sh`.
7. Generate thumbnails by running `./thumbs.sh`.

8. Run `python collect.py`.
9. Test app locally:
    
    Create the virtualenv and install the requirements as described above. New images probably don't show up because they are not uploaded yet.

10. Upload new images and thumbnails:
    
    `rsync -azP ./images/ root@cloud.juergstraumann.ch:/var/lib/dokku/data/storage/archiv/images/`

11. Sync data changes to github:

    This should affect `WERKVERZEICHNIS.csv`, `filters.csv` and `images.csv`.


### Image collection

Further explanation about the image collection workflow.

- The `convert` utility from [ImageMagick](https://imagemagick.org/) is required for this process.

- Use the `convert.sh` script to prepare an `images` folder with consistent formats (JPEG) and resolutions (720p).

- Then use `thumbs.sh` to generate thumbnails.

- The scripts skip any files that are already present, and can be used for updates.

### Filter data refresh

Further explanation about the data refresh.

- To update the metadata, we run this script from the pipenv shell: `python collect.py`.

- This script expects a `data/WERKVERZEICHNIS.csv` which is the UTF-8 encoded conversion of the source Excel file. It creates (or refreshes) a Data Package specification by inferring schema from the data using [Data Package Pipelines](https://github.com/frictionlessdata/datapackage-pipelines).

- The script also checks that images are present in the `images` folder. You may want to prepare the images first, if this is part of your use case. Otherwise, look at the source code to fit the process to your data.

### Adding new filters

- Add the new filter to `data/filters.csv` manually.
- Run `python collect.py` to update the count.
