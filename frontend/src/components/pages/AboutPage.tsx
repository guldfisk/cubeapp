import React from 'react'



export default class AboutPage extends React.Component {

  onImageClick = () => {
    const audio = new Audio('/static/dog_bark.wav');
    audio.play();
  };

  render() {
    return <div>
      <h1>Hello, welcome to my site :)</h1>
      <p>This is a website dedicated to hunting and dog keeping. No amateurs please, this is a resource for <b>PROFESSIONALS</b> only! 😠😠😠</p>
      <img
        src="/static/me_and_my_boi_in_the_woods.jpeg"
        alt="me and the boi"
        onClick={this.onImageClick}
      />
        <p>Useful links for the swell, swoll hunter man: <small>rip in peace</small></p>
        <ul>
          <li>
            <a href="http://www.ondfisk.dk/">For sea hunting</a>
          </li>
          <li>
            <a href="https://albert.dk">When the corners are to quite :((</a>
          </li>
          <li>
            <a href="http://plan-k.dk">When you need life advice</a>
          </li>
        </ul>
    </div>
  };

}