import React from 'react';
import {ReportNotification, UpdateReport} from "../../models/models";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";


const levelColorMap: { [k: string]: string } = {
  warning: 'red',
  info: 'white',
};

interface ReportNotificationListItemProps {
  notification: ReportNotification;
}


const ReportNotificationListItem: React.FunctionComponent<ReportNotificationListItemProps> = (props) => {
  return <div>
    <span
      style={{color: levelColorMap[props.notification.level]}}
    >
      <h4>{props.notification.title}</h4>
    </span>
    {
      props.notification.content.split('\n').map(
        (s: string) => <p>{s}</p>
      )
    }
  </div>
};


interface ReportViewProps {
  report: UpdateReport;

}


export default class ReportView extends React.Component<ReportViewProps> {

  render() {

    return <Row>
      <Col>
        {
          this.props.report.notifications.filter(
            notification => notification.level !== 'warning'
          ).map(
            notification => <Row
              key={notification.title}
            >
              <ReportNotificationListItem
                notification={notification}
              />
            </Row>
          )
        }
      </Col>
      <Col>
        {
          this.props.report.notifications.filter(
            notification => notification.level === 'warning'
          ).map(
            notification => <Row
              key={notification.title}
            >
              <ReportNotificationListItem
                notification={notification}
              />
            </Row>
          )
        }
      </Col>
    </Row>
  }

}