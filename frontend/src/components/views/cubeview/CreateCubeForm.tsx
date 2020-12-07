import React from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";


interface CreateCubeFormProps {
  handleSubmit: ({name, description}: { name: string, description: string }) => void
  defaultName?: string
  defaultDescription?: string
  enabled: boolean
}


export default class CreateCubeForm extends React.Component<CreateCubeFormProps> {

  static defaultProps = {
    enabled: true,
  };

  handleSubmit = (event: any) => {
    this.props.handleSubmit(
      {
        name: event.target.elements.name.value,
        description: event.target.elements.description.value,
      }
    );
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return <Form
      onSubmit={this.handleSubmit}
    >
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control type="text" defaultValue={this.props.defaultName}/>
      </Form.Group>
      <Form.Group controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control type="text" defaultValue={this.props.defaultDescription}/>
      </Form.Group>
      <Button type="submit" disabled={!this.props.enabled}>Create Cube</Button>
    </Form>
  }

}
