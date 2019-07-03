import axios from 'axios';

import {signingIn, authFailed, signInSuccess, reSignInSuccess, signOutSuccess} from '../state/actions.js';


export const loadUser = () => {
  return (dispatch, getState) => {
    const token = getState().token;
    if (!token) {
      dispatch({type: authFailed});
      return;
    }

    dispatch({type: signingIn});

    axios.get(
      "/api/auth/user/",
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        }
      },
    ).then(
      response => {
        dispatch({type: reSignInSuccess, user: response.data});
      }
    ).catch(
      exception => {
        dispatch({type: authFailed});
      }
    )
  }
};


export const signIn = (username, password) => {
  return (dispatch, getState) => {

    return axios.post(
      '/api/auth/login/',
      {username, password},
    ).then(
      result => {
        dispatch({type: signInSuccess, data: result.data});
      }
    ).catch(
      exception => {
        dispatch({type: authFailed});
      }
    )
  }
};


export const signOut = (token) => {
  return (dispatch, getState) => {

    return axios.post(
      '/api/auth/logout/',
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        }
      },
    ).then(
      result => {
        console.log('signed out');
        dispatch({type: signOutSuccess});
      }
    ).catch(
      exception => {
        console.log('oh noo');
        dispatch({type: authFailed});
      }
    )
  }
};