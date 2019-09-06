import React from 'react';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";


interface NodeParseFormProps {
  onSubmit: (group: string, weight: number) => void
}

class AddGroupForm extends React.Component<NodeParseFormProps> {

  handleSubmit = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    this.props.onSubmit(
      event.target.elements.group.value,
      parseInt(event.target.elements.weight.value),
    );
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="group">
        <Form.Label>Group</Form.Label>
        <Form.Control type="text"/>
      </Form.Group>
      <Form.Group controlId="weight">
        <Form.Label>Weight</Form.Label>
        <Form.Control type="number" defaultValue="1"/>
      </Form.Group>
      <Button type="submit">Add Group</Button>
    </Form>
  }

}


interface GroupAddViewProps {
  onSubmit: (group: string, weight: number) => void
}


export default class GroupAddView extends React.Component<GroupAddViewProps> {

  constructor(props: any) {
    super(props);
  };

  render() {

    return <AddGroupForm onSubmit={this.props.onSubmit}/>
  }

}
