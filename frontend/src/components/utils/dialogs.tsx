import React from 'react';

import Button from "react-bootstrap/Button";
import {Modal} from 'react-bootstrap';


interface ConfirmationDialogProps {
  callback: () => void
  cancel: () => void
  show: boolean
  message?: string
}

export const ConfirmationDialog: React.SFC<ConfirmationDialogProps> = (props: ConfirmationDialogProps) => {
  return <Modal
    show={props.show}
  >
  <Modal.Header closeButton>
    <Modal.Title>
      {
        props.message || 'U sure about that?'
      }
    </Modal.Title>
  </Modal.Header>
  <Modal.Footer>
    <Button variant="secondary" onClick={props.cancel}>Close</Button>
    <Button variant="primary" onClick={props.callback}>Ok</Button>
  </Modal.Footer>
</Modal>
};