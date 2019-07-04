import React from 'react';

import {Link} from "react-router-dom";

import Table from "react-bootstrap/Table";


class CubesView extends React.Component {

  render() {
    return <Table>
      <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Description</th>
        <th>Author</th>
        <th>Last Release</th>
        <th>Last Update</th>
        <th>Releases</th>
        <th>Created At</th>
      </tr>
      </thead>
      <tbody>
        {
         this.props.cubes.map(
           cube => {
             return <tr>
               <td>{cube.id()}</td>
               <td>{cube.name()}</td>
               <td>{cube.description()}</td>
               <td>{cube.author().username}</td>
               <td>
                 <Link to={'/release/' + cube.latestRelease().id()}>
                   {cube.latestRelease().name()}
                 </Link>
               </td>
               <td>{cube.latestRelease().createdAt()}</td>
               <td>{cube.releases().length}</td>
               <td>{cube.createdAt()}</td>
             </tr>
           }
         )
        }
      </tbody>
    </Table>

  }

}

export default CubesView;