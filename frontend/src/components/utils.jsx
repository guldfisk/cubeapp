import React from "react";

import axios from 'axios';

import '../styling/utils.css';


export const get_api_path = () => '/api/';
const get_images_path = () => get_api_path() + 'images/';


export const get_cubes = () => {
  return axios.get(get_api_path());
};

export const getRelease = (id) => {
  return axios.get(get_api_path() + 'cube-releases/' + id +'/');
};

export const getCube = (id) => {
  return axios.get(get_api_path() + 'versioned-cubes/' + id +'/');
};

export const get_cubeable_images_url = (id, type='printing', size_slug='original') => {
  return get_images_path() + id + '/?type=' + type + '&size_slug=' + size_slug
};

export const get_cardback_image_url = (size_slug='original') => {
  return get_images_path() + 'back/?size_slug=' + size_slug
};


export const Loading = (props) => {
  return <h3 className="loading">Loading...</h3>
};