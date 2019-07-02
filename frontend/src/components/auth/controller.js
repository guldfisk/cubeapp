import axios from 'axios';

import {signingIn, authFailed, signInSuccess} from '../state/actions.js';


export const loadUser = () => {
  return (dispatch, getState) => {
    const token = getState().auth.token;
    if (!token) {return}

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
      result => {
        dispatch({type: signInSuccess, user: result.data });
        // if (result.status === 200) {
        //  dispatch({type: signInSuccess, user: result.data });
        // } else {
        //   dispatch({type: authFailed, user: result.data });
        // }
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
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify({username, password});

    return axios.post(
      '/api/auth/login',
      body,
      {headers},
    ).then(
      result => {
        dispatch({type: 'LOGIN_SUCCESSFUL', data: result.data });
      }
    ).catch(
      exception => {
        dispatch({type: authFailed});
      }
    )

  }
};