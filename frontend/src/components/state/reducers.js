import {signingIn, authFailed, signInSuccess, reSignInSuccess, signOutSuccess} from "./actions";


const initialState = {
  token: localStorage.getItem("token"),
  authenticated: null,
  loading: true,
  user: null,
  authenticationError: "",
};


export default function authReducer(state=initialState, action) {

  switch (action.type) {

    case signingIn:
      return {...state, loading: true};

    case signInSuccess:
      localStorage.setItem("token", action.data.token);
      return {...state, token: action.data.token, user: action.data.user, authenticated: true, loading: false};

    case reSignInSuccess:
      return {...state, user: action.data, authenticated: true, loading: false};

    case signOutSuccess:
      localStorage.removeItem("token");
      return {...state, authenticated: false, loading: false, user: null, token: null};

    case authFailed:
      return {...state, loading: false};

    default:
      return state;
  }
}