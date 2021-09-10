import axios from "axios";
import store from "../state/store";
import {apiPath} from "../models/models";


export const getRefreshRedirect = (): Promise<string> => {
  return axios.post(
    apiPath + 'kpd/get-authentication-link/',
    {},
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${store.getState().token}`,
      }
    },
  ).then(
    response => response.data.url
  )
}

export const createSession = (code: string): Promise<string> => {
  return axios.post(
    apiPath + 'kpd/create-session/' + code + '/',
    {},
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${store.getState().token}`,
      }
    },
  ).then(
    response => response.data.valid_until
  )
}
