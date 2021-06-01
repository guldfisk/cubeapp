import {signingIn, authFailed, signInSuccess, reSignInSuccess, signOutSuccess, userEdited} from "./actions";
import {User} from "../models/models";


const initialState = {
  token: null,
  authenticated: null,
  errorMessage: null,
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
      return {
        ...state,
        token: action.data.token,
        user: User.fromRemote(action.data.user),
        authenticated: true,
        loading: false,
        errorMessage: null,
      };

    case reSignInSuccess:
      return {
        ...state,
        user: User.fromRemote(action.data),
        token: action.token,
        authenticated: true,
        loading: false,
        errorMessage: null,
      };

    case signOutSuccess:
      localStorage.removeItem("token");
      return {...state, authenticated: false, loading: false, user: null, token: null, errorMessage: null};

    case authFailed:
      return {...state, loading: false, errorMessage: action.errorMessage};

    case userEdited:
      return {...state, user: action.user}

    default:
      return state;
  }
}