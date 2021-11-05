import React, {FunctionComponent} from "react";

import '../../styling/utils.css';

import axios from 'axios';

import {apiPath} from "../models/models";

import store from '../state/store';


const imagesPath = '/api/images/';
const staticImagesPath = '/images/';


const sizeSlugMap: { [key: string]: string } = {
  original: '',
  medium: '_m',
  small: '_s',
  thumbnail: '_t',
};


const typeDirectoryMap: { [key: string]: string } = {
  Printing: '',
  printing: '',
  Trap: '_cube_traps/',
  trap: '_cube_traps/',
  Ticket: '_tickets/',
  ticket: '_tickets/',
  Purple: '_purples/',
  purple: '_purples/',
};


const _getSuffix = (size_slug: string, cropped: boolean): string => {
  return sizeSlugMap[size_slug] + (cropped ? '_c' : '')
};


export function get_imageable_image_static_url(
  id: string,
  type = 'Printing',
  size_slug = 'original',
  cropped: boolean = false,
) {
  return (
    staticImagesPath
    + typeDirectoryMap[type]
    + id
    + _getSuffix(size_slug, cropped)
    + '.png'
  )
}


export function get_imageable_image_url(
  id: string,
  type = 'Printing',
  size_slug = 'original',
  cropped: boolean = false,
) {
  return (
    imagesPath
    + id.toString().replace(/\//g, '_')
    + '/?type=' + type
    + '&size_slug=' + size_slug
    + '&cropped=' + (cropped ? '1' : '0')
  )
}

export const get_cardback_image_url = (size_slug: string = 'original', cropped: boolean = false) => {
  return imagesPath + 'back/?size_slug=' + size_slug + '&cropped=' + (cropped ? '1' : '0')
};


export const Loading: React.FunctionComponent = () => {
  return <h3 className="loading">Loading...</h3>
};


export const NotAllowed: React.FunctionComponent = () => {
  return <h3 className="loading">Not Allowed</h3>
};


export const NotFound: React.FunctionComponent = () => {
  return <h3 className="loading">Not Found</h3>
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
  extractor: (extractable: T) => string
): ((first: T, second: T) => number) {
  return (first: T, second: T) => {
    const f = extractor(first).toLowerCase();
    const s = extractor(second).toLowerCase();
    return (f < s) ? -1 : (f > s) ? 1 : 0;
  }
}

export function integerSortFactory<T>(
  extractor: (extractable: T) => number,
  reverse: boolean = false,
): ((first: T, second: T) => number) {
  return (first: T, second: T) => {
    const f = extractor(first);
    const s = extractor(second);
    return ((f < s) ? -1 : (f > s) ? 1 : 0) * (reverse ? -1 : 1);
  }
}


export function integerSort(first: string, second: string) {
  const f = parseInt(first);
  const s = parseInt(second);
  return (f < s) ? -1 : (f > s) ? 1 : 0;
}


export class UserGroup {
  users: Set<String>;

  constructor() {
    this.users = new Set();
  }

  add = (userName: string): void => {
    this.users.add(userName);
  };

  remove = (userName: string): void => {
    this.users.delete(userName);
  };

}

export const getEditDistance = (a: string, b: string): number => {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  const matrix = [];

  let i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  let j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1));
      }
    }
  }

  return matrix[b.length][a.length];
};


export function* range(start: number, stop: number, step: number = 1) {
  if (stop == null) {
    stop = start;
    start = 0;
  }

  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    yield i;
  }
}


export const randomString = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};


export const roundToN = (v: number, n: number = 2) => {
  return Math.round((v + Number.EPSILON) * 10 ** n) / (10 ** n)
}
