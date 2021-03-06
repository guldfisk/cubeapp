import axios from 'axios';

import {signingIn, authFailed, signInSuccess, reSignInSuccess, signOutSuccess} from '../state/actions.js';


export const signUp = ({username, email, password, inviteToken}) => {
  return (dispatch, getState) => {
    return axios.post(
      '/api/auth/signup/',
      {
        username,
        email,
        password,
        invite_token: inviteToken,
      }
    ).then(
      response => {
        dispatch({type: signInSuccess, data: response.data});
      }
    ).catch(
      error => {
        dispatch(
          {
            type: authFailed,
            errorMessage: typeof (error.response.data) === 'string' ?
              error.response.data
              : Object.entries(error.response.data).map(
                ([key, value]) => key.toString() + ': ' + value.toString()
              ).join(', '),
          }
        )
      }
    )
  }
};


export const loadUser = () => {
  return (dispatch, getState) => {
    const token = localStorage.getItem("token");
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
        dispatch({type: reSignInSuccess, data: response.data, token: token});
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
      error => {
        dispatch({type: authFailed, errorMessage: "Invalid username or password"});
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
        dispatch({type: signOutSuccess});
      }
    ).catch(
      exception => {
        dispatch({type: authFailed});
      }
    )
  }
};


export const resetPassword = (username, email) => {
  return axios.post(
    '/api/user/reset-password/',
    {username, email},
  )
};


export const claimPasswordReset = (code, newPassword) => {
  return axios.post(
    '/api/user/claim-reset-password/',
    {code, new_password: newPassword},
  )
};


