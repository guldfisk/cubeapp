import {signingIn, authFailed, signInSuccess} from "./actions";


const initialState = {
  token: localStorage.getItem("token"),
  authenticated: null,
  loading: true,
  user: null,
};


export default function authReducer(state=initialState, action) {

  switch (action.type) {

    case signingIn:
      return {...state, isLoading: true};

    case signInSuccess:
      localStorage.setItem("token", action.data.token);
      return {...state, ...action.data, isAuthenticated: true, isLoading: false};

    case authFailed:
    // case 'LOGOUT_SUCCESSFUL':
    //   localStorage.removeItem("token");
    //   return {...state, errors: action.data, token: null, user: null,
    //     isAuthenticated: false, isLoading: false};

    default:
      return state;
  }
}