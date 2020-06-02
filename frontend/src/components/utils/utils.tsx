import React from "react";

import '../../styling/utils.css';

import axios from 'axios';

import {apiPath} from "../models/models";

import store from '../state/store';


const imagesPath = '/api/images/';


export function get_imageable_image_url(
  id: string,
  type = 'printing',
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


export const Loading: React.SFC = () => {
  return <h3 className="loading">Loading...</h3>
};


export const NotAllowed: React.SFC = () => {
  return <h3 className="loading">Not Allowed</h3>
};


export const NotFound: React.SFC = () => {
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
  extractor:
    (extractable: T) => string
): ((first: T, second: T) => number) {
  return (first: T, second: T) => {
    const f = extractor(first).toLowerCase();
    const s = extractor(second).toLowerCase();
    return (f < s) ? -1 : (f > s) ? 1 : 0;
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

export const factorial = (n: number): number => {
  let resultValue = 1;
  for (let i = 2; i <= n; i++) {
    resultValue = resultValue * i;
  }
  return resultValue;
};


export const sizeTwoSetCombinations = (n: number): number => {
  if (n <= 1) {
    return 0
  }
  return factorial(n) / (2 * factorial(n - 2))
};
