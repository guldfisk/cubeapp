import axios from 'axios';



const get_path = () => window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + '/';


export const get_cubes = () => {

  const path = get_path() + 'spoiler/';
  console.log(path);

  axios.get(path).then(
    response => console.log(response)
  );

};