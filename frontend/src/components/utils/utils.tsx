import React from "react";

import '../../styling/utils.css';

import axios from 'axios';

import {Printing, Trap, PrintingNode, apiPath} from "../models/models";
import {CubeableImage} from "../images";
import ReactTooltip from 'react-tooltip';

import store from '../state/store';
import {number} from "prop-types";


const imagesPath = '/api/images/';


export function get_cubeable_images_url(id: string, type = 'printing', size_slug = 'original') {
  return imagesPath + id + '/?type=' + type + '&size_slug=' + size_slug
}

export const get_cardback_image_url = (size_slug = 'original') => {
  return imagesPath + 'back/?size_slug=' + size_slug
};


export const Loading: React.SFC = () => {
  return <h3 className="loading">Loading...</h3>
};


export const inviteUser = (email: string) => {
  return axios.post(
    apiPath + 'auth/invite/',
    {email},
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${store.getState().token}`,
      }
    },
  )
};


export function alphabeticalPropertySortMethodFactory<T>(
  extractor:
    (extractable: T) => string
): ((first: T, second: T) => number) {
  return (first: T, second: T) => {
    const f = extractor(first).toLowerCase();
    const s = extractor(second).toLowerCase();
    return (f < s) ? -1 : (s > f) ? 1 : 0;
  }
}