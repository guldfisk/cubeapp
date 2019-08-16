import React from 'react';

import {Link} from "react-router-dom";

import Table from "react-bootstrap/Table";
import {Cube} from "../../models/models";


interface CubesViewProps {
  cubes: Cube[]
}

class CubesView extends React.Component<CubesViewProps> {

  render() {
    return <Table>
      <thead>
      <tr>
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
           (cube: Cube) => {
             return <tr>
               <td>
                 <Link to={"/cube/" + cube.id}>
                   {cube.name}
                 </Link>
               </td>
               <td>{cube.description}</td>
               <td>{cube.author.username}</td>
               <td>
                 {
                   cube.latestRelease() !== null ?
                     <Link to={'/release/' + cube.latestRelease().id}>
                       {cube.latestRelease().name}
                     </Link>
                     :
                     "No releases"
                 }
               </td>
               <td>
                  {
                    cube.latestRelease() !== null ?
                      cube.latestRelease().createdAt
                      :
                      "No releases"
                  }
               </td>
               <td>{cube.releases.length}</td>
               <td>{cube.createdAt}</td>
             </tr>
           }
         )
        }
      </tbody>
    </Table>

  }

}

export default CubesView;