import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import StatusListContainer from '../ui/containers/status_list_container';
import Column from '../../components/column';
import ColumnHeader from '../../components/column_header';
import {
  refreshTimeline,
  updateTimeline,
  deleteFromTimelines,
} from '../../actions/timelines';
import { addColumn, removeColumn, moveColumn } from '../../actions/columns';
import ColumnBackButtonSlim from '../../components/column_back_button_slim';
import { FormattedMessage } from 'react-intl';
import createStream from '../../stream';

const mapStateToProps = state => ({
  hasUnread: state.getIn(['timelines', 'tag', 'unread']) > 0,
  streamingAPIBaseURL: state.getIn(['meta', 'streaming_api_base_url']),
  accessToken: state.getIn(['meta', 'access_token']),
});

class HashtagTimeline extends React.PureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    columnId: PropTypes.string,
    dispatch: PropTypes.func.isRequired,
    streamingAPIBaseURL: PropTypes.string.isRequired,
    accessToken: PropTypes.string.isRequired,
    hasUnread: PropTypes.bool,
  };

  handlePin = () => {
    const { columnId, dispatch } = this.props;

    if (columnId) {
      dispatch(removeColumn(columnId));
    } else {
      dispatch(addColumn('HASHTAG', { id: this.props.params.id }));
    }
  }

  handleMove = (dir) => {
    const { columnId, dispatch } = this.props;
    dispatch(moveColumn(columnId, dir));
  }

  _subscribe (dispatch, id) {
    const { streamingAPIBaseURL, accessToken } = this.props;

    this.subscription = createStream(streamingAPIBaseURL, accessToken, `hashtag&tag=${id}`, {

      received (data) {
        switch(data.event) {
        case 'update':
          dispatch(updateTimeline('tag', JSON.parse(data.payload)));
          break;
        case 'delete':
          dispatch(deleteFromTimelines(data.payload));
          break;
        }
      },

    });
  }

  _unsubscribe () {
    if (typeof this.subscription !== 'undefined') {
      this.subscription.close();
      this.subscription = null;
    }
  }

  componentDidMount () {
    const { dispatch } = this.props;
    const { id } = this.props.params;

    dispatch(refreshTimeline('tag', id));
    this._subscribe(dispatch, id);
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.params.id !== this.props.params.id) {
      this.props.dispatch(refreshTimeline('tag', nextProps.params.id));
      this._unsubscribe();
      this._subscribe(this.props.dispatch, nextProps.params.id);
    }
  }

  componentWillUnmount () {
    this._unsubscribe();
  }

  render () {
    const { hasUnread, columnId } = this.props;
    const { id } = this.props.params;
    const pinned = !!columnId;

    return (
      <Column>
        <ColumnHeader
          icon='hashtag'
          active={hasUnread}
          title={id}
          onPin={this.handlePin}
          onMove={this.handleMove}
          pinned={pinned}
        />

        <StatusListContainer
          scrollKey={`hashtag_timeline-${columnId}`}
          type='tag'
          id={id}
          emptyMessage={<FormattedMessage id='empty_column.hashtag' defaultMessage='There is nothing in this hashtag yet.' />}
        />
      </Column>
    );
  }

}

export default connect(mapStateToProps)(HashtagTimeline);
