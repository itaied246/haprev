import { Authorize } from "../../services";
import * as firebase from 'firebase';

const AUTHORIZE_REQ = "haprev/user/AUTHORIZE_REQ";
const AUTHORIZE_RES = "haprev/user/AUTHORIZE_RES";
const REGISTER_REQ = "haprev/user/REGISTER_REQ";
const REGISTER_RES = "haprev/user/REGISTER_RES";
const NO_USER_FOUND = "haprev/user/NO_USER_FOUND";
const SPLASH = "haprev/user/SPLASH";
const SET_MESSAGE_READ = "haprev/user/SET_MESSAGE_READ";

const initalState = {
  user: {},
  status: '',
  splashStatus:false,
  authStatus:''
};

export default (state = initalState, action = {}) => {
  switch (action.type) {
    case AUTHORIZE_REQ:
      return { ...state, authStatus: 'auth_request', user: {} };
    case AUTHORIZE_RES:
      return { ...state, authStatus: 'user', user: action.payload ,status:canProceed(state) }
    case NO_USER_FOUND:
      return {...state,authStatus:'no_user',status:canProceed(state) }
    case SPLASH:
      return {...state, splashStatus: action.payload,status:canProceed(state)}
    case SET_MESSAGE_READ:
      return {...state,
              user: {
                ...state.user,
                messages: action.payload  
              } 
           };
    default:
      return state;
  }
};

const authReq = appId => ({
  type: AUTHORIZE_REQ,
  payload: appId
});

const authRes = data => {
  let tmpRes = {};
  if (data)
    tmpRes = {
      type: AUTHORIZE_RES,
      payload: data
    };
  return tmpRes;
};

const noUserFound = () =>({
  type: NO_USER_FOUND
})

export const authorize = appId =>  dispatch  => {
  dispatch(authReq(appId))
  firebase.database().ref('users/'+appId).once('value' , 
    snapshot => {
      let dbRes = snapshot.val();
      if (dbRes)
        dispatch (authRes( snapshot.val()))
      else
        dispatch (noUserFound())
        //console.log('handle user not found')
  })
}

const canProceed = state =>{
  return  (!state.user.splashStatus && state.user.authStatus!='auth_request')
}

const registerReq = user => ({
  type: REGISTER_REQ,
  payload: user
})

const registerRes = data => {
  let tmpRes = {};
  if (data)
    tmpRes = {
      type: REGISTER_RES,
      payload: data
    }
  return tmpRes;
}

export const splash = (display) => ({type:SPLASH , payload:display})  

const setMessagesRead = msgId => {
  return {
    type: SET_MESSAGE_READ,
    payload: msgId
  }
};

export const readMessage = msgId => async (dispatch,state)  => {
  messagesObj = state().user.user.messages;
  messagesArray = Object.keys(messagesObj).map(key => { return messagesObj[key] });
  currentMessages = messagesArray.filter(msg => { return msg.id !== msgId })
  await dispatch(setMessagesRead(currentMessages));

  let res = firebase.database().ref('users/'+state().user.user.appId).update({messages: state().user.user.messages})
    .then(() => {
      return 'ok'
    })
    .catch(error => {
      console.log('Data could not be saved.' + error);
      return 'err'
    });
  return res;  
};

export const setMessage = (msg,appId) => {
  // format msg -> {id: 'ek67', message: 'ההתנדבות ב 9.1 בבית חולים בלינסון בוטלה'}
  firebase.database().ref('users/'+appId+'/messages').push().set(msg);
}