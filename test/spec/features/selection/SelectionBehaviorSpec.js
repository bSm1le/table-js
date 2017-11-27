import Inferno from 'inferno';

import { inject, bootstrap } from 'test/TestHelper';

import SelectionModule from 'lib/features/selection';

function triggerMouseEvent(node, event, clientX = 0, clientY = 0) {
  const e = document.createEvent('MouseEvent');

  if (e.initMouseEvent) {
    e.initMouseEvent(event, true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  }

  node.dispatchEvent(e);
}


describe('SelectionBehavior', function() {

  beforeEach(bootstrap({
    modules: [ SelectionModule ]
  }));

  beforeEach(inject(function(components, elementRegistry, eventBus, sheet) {
    const row = { id: 'row' },
          col = { id: 'col' };

    const cell = {
      id: 'cell',
      row,
      col
    };

    elementRegistry.add(row);
    elementRegistry.add(col);
    elementRegistry.add(cell);

    components.onGetComponent('table.body', () => () => {
      return (
        <tbody>
          <tr>
            <td data-element-id="cell"></td>
          </tr>
        </tbody>
      );
    });

    eventBus.fire('elements.changed', { elements: [ sheet.getRoot() ] });
  }));


  it('should select on click', inject(function(elementRegistry, eventBus, selection) {
    
    // when
    eventBus.fire('cell.click', { id: 'cell' });

    // then
    expect(selection.get()).to.eql(elementRegistry.get('cell'));
  }));


  it('should unselect on click', inject(function(eventBus, selection) {

    // given
    eventBus.fire('cell.click', { id: 'cell' });

    // when
    triggerMouseEvent(document.body, 'click');

    // then
    expect(selection.get()).to.not.exist;
  }));
  

  it('should unselect on row.remove', inject(function(elementRegistry, eventBus, selection) {
    
    // given
    selection.select('cell');

    // when
    eventBus.fire('row.remove', {
      row: elementRegistry.get('row')
    });

    // then
    expect(selection.get()).to.not.exist;
  }));


  it('should unselect on col.remove', inject(function(elementRegistry, eventBus, selection) {
    
    // given
    selection.select('cell');

    // when
    eventBus.fire('col.remove', {
      col: elementRegistry.get('col')
    });

    // then
    expect(selection.get()).to.not.exist;
  }));

});