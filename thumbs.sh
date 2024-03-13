#!/bin/bash

source=$(pwd)/images
tgt="thumb"

for dir in "${source}"/WV_neu*/; do
    target_dir="${dir}${tgt}"
    echo "Creating thumbnails in: ${target_dir}"
    mkdir -p "${target_dir}"
    # No need to change directory; use absolute paths instead
    for file in "${dir}"*.jpg; do
        if [ -f "$file" ]; then  # Check if file exists to handle the case where *.jpg matches nothing
            fn=$(basename "$file")
            bn=${fn%.*}
            if [ ! -f "${target_dir}/${bn}.jpg" ]; then
                echo "Thumbnailing: ${target_dir}/${bn}.jpg"
                convert -verbose -resize "200x200^" -gravity center -crop "200x200+0+0" +repage \
                    "$file" "${target_dir}/${bn}.jpg"
            fi
        fi
    done
done
