#!/bin/bash

source=$(pwd)/IMPORT
target=$(pwd)/images

# Ensure the loop handles filenames with spaces correctly
IFS=$'\n'

for dir in "${source}"/WV_*; do
    # Removed unnecessary dir manipulation
    tgt="${target}/$(basename "$dir")"
    mkdir -p "${tgt}"
    src="${dir}"
    echo "Converting from: ${src}"
    echo "Converting to: ${tgt}"

    # Use find to handle different file types and complex filenames
    find "${src}" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.tif' -o -iname '*.tiff' \) -exec bash -c '
        for file; do
            tgt_folder="'$tgt'"  # Pass the target directory
            fn=$(basename "$file")
            bn="${fn%.*}"
            if [ ! -f "${tgt_folder}/${bn}.jpg" ]; then
                echo "Converting: ${tgt_folder}/${bn}.jpg"
                convert -verbose -resize "1920x1080>" "$file" "${tgt_folder}/${bn}.jpg"
            fi
        done
    ' bash {} +
done
