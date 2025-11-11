#!/bin/bash

if [[ -z $1 ]]; then
    echo "Function name missing"
    exit 1
fi

cd $1

cargo lambda build --release --output-format zip
sam deploy
