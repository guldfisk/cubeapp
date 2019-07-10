import React from "react";

import '../styling/utils.css';

const imagesPath = '/api/images/';


export function get_cubeable_images_url(id: string, type='printing', size_slug='original') {
  return imagesPath + id + '/?type=' + type + '&size_slug=' + size_slug
}

export const get_cardback_image_url = (size_slug='original') => {
  return imagesPath + 'back/?size_slug=' + size_slug
};


export interface NoProps {
}

export interface NoState {
}

export const Loading: React.SFC<NoProps> = () => {
  return <h3 className="loading">Loading...</h3>
};
