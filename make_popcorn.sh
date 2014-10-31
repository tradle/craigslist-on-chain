#!/bin/bash

# Script usage
#   ./make_popcorn [clone_from]
#   Either download this file or clone this repository and run ./make_popcorn.sh to quickly grab all required dependancies and install them
#   This script will ask for sudo when it needs it in order to install packages correctly and fix permissions.
#
#   When you run this script from inside of a cloned Popcorn Time repository, it will skip over cloning and simply work on dependancies
#
#   When you run this script from outside of any repositroy, it will ask you if you wish to clone Popcorn Time into a folder
#   When doing this, you have the option to grab the source from an alternate repostiry by passing it as the first argument of the script
#   Optinally, you may just use 'ssh' as replacement for a git-url and it will clone via the main repo's ssh url instead.
#     Note: You need permissions to clone via ssh


clone_repo="True"
if [ -z "${1}" ]; then
    clone_url="https://git.popcorntime.io/stash/scm/pt/popcorn-app.git"
elif [ "${1}" == "ssh" ]; then
    clone_url="ssh://git@git.popcorntime.io/pt/popcorn-app.git"
else
    clone_url="${1}"
fi
echo "Using ${clone_url}"
clone_command () { git clone ${clone_url} ${dir}; }

if [ -e ".git/config" ]; then
    dat=`cat .git/config | grep 'url'`
    if [[ "${dat}" == *popcorn-app* ]]; then
        echo "You appear to be inside of a Popcorn Time repository already, not cloning"
        clone_repo="False"
    else   
        try="True"
        while [ "${try}" == "True" ]; do
            read -p "Looks like we are inside a git repository, do you wish to clone inside it? (yes/no) [no] " rd_cln
            if [ -z "${rd_cln}" ]; then 
                rd_cln='no'
            fi
            if [ "${rd_cln}" == "yes" ] || [ "${rd_cln}" == "no" ]; then
                try="False"
            else
                echo "Not a valid answer, please try again"
            fi
        done
        if [ "$rd_cln" == "no" ]; then
            echo "You appear to be inside of a Popcorn Time repository already, not cloning"
            clone_repo="False"
        else
            echo "You've chosen to clone inside the current directory"
        fi
    fi
fi
if [ "${clone_repo}" == "True" ]; then
    echo "Cloning Popcorn Time"
    read -p "Where do you wish to clone popcorn time to? [popcorn-app] " dir
    if [ -z "${dir}" ]; then 
        dir='popcorn-app'
    elif [ "${dir}" = "/" ]; then
        dir='popcorn-app'
    fi
    if [ ! -d "${dir}" ]; then
        clone_command
        echo "Cloned Popcorn Time successfully"
    else
        try="True"
        while [ "$try" == "True" ]; do
            read -p "Directory ${dir} already exists, do you wish to delete it and redownload? (yes/no) [no] " rd_ans
            if [ -z "${rd_ans}" ]; then 
                rd_ans='no'
            fi
            if [ "${rd_ans}" == "yes" ] || [ "${rd_ans}" == "no" ]; then
                try="False"
            else
                echo "Not a valid answer, please try again"
            fi
        done
        if [ "${rd_ans}" == "yes" ]; then
            echo "Removing old directory"
            if [ "${dir}" != "." ] || [ "${dir}" != "$PWD" ]; then
                echo "Cleaning up from inside the destination directory"
                sudo rm -rf ${dir}/*
            else
                echo "Cleaning up from outside the destination directory"
                sudo rm -rf ${dir}
            fi
            clone_command
            echo "Cloned Popcorn Time successfully"
        else
            echo "Directory already exists and you've chosen not to clone again"
        fi
    fi
fi
try="True"
while [ "${try}" == "True" ]; do
    read -p "Do you wish to install the required dependancies for Popcorn Time and setup for building? (yes/no) [yes] " rd_dep
    if [ -z "${rd_dep}" ]; then 
        rd_dep="yes"
    fi
    if [ "${rd_dep}" == "yes" ] || [ "${rd_dep}" == "no" ]; then
        try="False"
    else
        echo "Not a valid answer, please try again"
    fi
done
if [ "${rd_dep}" == "yes" ]; then
    if [ -z "${dir}" ]; then
        dir="."
    fi
    echo "Installing global dependancies"
    sudo npm install -g bower grunt-cli
    cd ${dir}
    echo "Global dependancies installed successfully!"
    echo "Installing local dependancies"
    sudo npm install 
    echo "Dependancies installed successfully!"
    sudo chown -R $USER .
    sudo chown -R $USER ~/.cache
    bower install
    echo "Successfully setup for Popcorn Time"
fi
grunt build
echo "Popcorn Time built sucessfully!"
echo "Run 'grunt start' from inside the repository to launch the app"
echo "Enjoy!"
