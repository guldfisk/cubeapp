import axios from 'axios';

axios.defaults.headers.common['Accept'] = 'application/json';

const get_path = () => window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/';
export const get_api_path = () => get_path() + 'spoiler/';
const get_images_path = () => get_api_path() + 'images/';


export const get_cubes = () => {
  return axios.get(get_api_path());
};

export const get_cube = (id) => {
  const path = get_api_path() + id +'/';
  return axios.get(path);
};

export const get_cubeable_images_url = (id, type='printing', size_slug='original') => {
  return get_images_path() + id + '/?type=' + type + '&size_slug=' + size_slug
};