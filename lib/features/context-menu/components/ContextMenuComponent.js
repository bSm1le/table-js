
// eslint-disable-next-line
import Inferno from 'inferno';
import Component from 'inferno-component';

import assign from 'lodash/assign';

import Ids from 'ids';

const ids = new Ids();


export default class ContextMenuComponent extends Component {

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      position: {
        x: 0,
        y: 0
      }
    };

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  /**
   * 
   * @param {Object} position - Position of context menu. Can either be point or box.
   * Context Menu will figure out best position.
   * @param {number} position.x - X coordinate of position.
   * @param {number} position.y - Y coordinate of position.
   * @param {number} position.width - Width of position box.
   * @param {number} position.height - Height of position box.
   * @param {Object} [context] - Context.
   * @param {boolean} [context.closeOnClick] - Specifies if context menu should be closed on click.
   */
  open({ position, context }) {

    if (!position) {
      position = { x: 0, y: 0 };
    }

    if (!context) {
      context = {};
    }

    const id = ids.next();

    this.setState({
      id,
      isOpen: true,
      position,
      context
    }, () => {

      // prevent listener being called immediately due to event bubbling
      setTimeout(() => {
        window.addEventListener('click', this.onClick(id));
      });
    });
  }

  /**
   * Closes context menu and resets state.
   */
  close() {
    this.setState({
      id: undefined,
      context: undefined,
      isOpen: false,
      position: {
        x: 0,
        y: 0
      }
    });
  }

  /**
   * Returns event listener that closes context menu with specified ID if
   * event target was not context menu itself and removes itself afterwards.
   * 
   * @param {string} id - ID of context menu that will be closed by this listener.
   */
  onClick(id) {

    const listener = ({ target }) => {
      const { context } = this.state;

      if (this.state.id === id) {

        if (!this.node) {

          // TODO(philippfromme): listener should be removed on componentWillUnmount
          window.removeEventListener('click', listener);

          return;
        }

        // close context menu
        if (context.closeOnClick !== false && !this.node.contains(target)) {
          this._eventBus.fire('contextMenu.close');
          
          window.removeEventListener('click', listener);
        }

      } else {

        // context menu with ID was closed
        window.removeEventListener('click', listener);
      }
      
    };

    return listener;
  }

  componentWillMount() {
    const { injector } = this.context;
    
    this._components = injector.get('components');

    const eventBus = this._eventBus = injector.get('eventBus');
    this._renderer = injector.get('renderer');

    eventBus.on('contextMenu.open', this.open);
    eventBus.on('contextMenu.close', this.close);
  }

  componentWillUnmount() {
    this._eventBus.off('contextMenu.open', this.open);
    this._eventBus.off('contextMenu.close', this.close);
  }

  // get best position and layout
  componentDidUpdate() {
    if (!this.state.isOpen) {
      return;
    }

    const { position } = this.state;

    if (!this.node) {
      return;
    }

    const bounds = this.node.getBoundingClientRect();

    if (!position.width) {
      position.width = 0;
    }

    if (!position.height) {
      position.height = 0;
    }

    const container = this._renderer.getContainer();

    const containerBounds = container.getBoundingClientRect();

    if (containerBounds.width > containerBounds.height) {
      this.node.classList.add('horizontal');
      this.node.classList.remove('vertical');
    } else {
      this.node.classList.add('vertical');
      this.node.classList.remove('horizontal');
    }

    const { scrollLeft, scrollTop } = container;

    const contextMenuPosition = {};

    if (position.x + (position.width / 2) > containerBounds.width / 2) {
      contextMenuPosition.left =
        (position.x
        - containerBounds.left
        - bounds.width
        + scrollLeft)
        + 'px';
    } else {
      contextMenuPosition.left =
        (window.scrollX
        - containerBounds.left
        + position.x
        + position.width
        + scrollLeft)
        + 'px';
    }

    if (position.y + (position.height / 2) > containerBounds.height / 2) {
      contextMenuPosition.top =
        (position.y
        - containerBounds.top
        - bounds.height
        + scrollTop)
        + 'px';
    } else {
      contextMenuPosition.top =
        (window.scrollY
        - containerBounds.top
        + position.y
        + scrollTop)
        + 'px';
    }

    assign(this.node.style, contextMenuPosition);
  }

  render() {
    const { context, isOpen } = this.state;

    const contextMenuComponents = this._components.getComponents('context-menu', context);

    if (!contextMenuComponents || !contextMenuComponents.length) {
      return null;
    }

    

    return (
      isOpen &&
        <div
          ref={ node => this.node = node }
          onContextMenu={ e => e.preventDefault() }
          className="context-menu">
          { 
            contextMenuComponents && 
            contextMenuComponents.map((Component, index) => <Component key={ index } context={ context } />)
          }
        </div>
    );
  }
}