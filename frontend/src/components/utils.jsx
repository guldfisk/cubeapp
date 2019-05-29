import axios from 'axios';


const get_path = () => window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/';
const get_api_path = () => get_path() + 'spoiler/';
const get_images_path = () => get_api_path() + 'images/';


export const get_cubes = () => {
  console.log(get_api_path());
  return axios.get(get_api_path());
};

export const get_cube = (id) => {
  let path = get_api_path() + id;
  return axios.get(path);
};

export const get_printing_image_url = (printing) => {
  return get_images_path() + printing.id;
};

export const get_trap_image_url = trap => {
  return get_images_path() + trap.hash + '?type=trap'
}