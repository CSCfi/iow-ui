import * as joint from 'jointjs';

export class LinkWithoutUnusedMarkup extends joint.dia.Link {
  markup = [
    '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
    '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
    '<path class="connection-wrap" d="M 0 0 0 0"/>',
    '<g class="labels"/>',
    '<g class="marker-vertices"/>'
  ].join('');

  toolMarkup = '';
}

const classMarkup = (shadow: boolean) => {
  return `<g class="rotatable ${shadow ? 'shadow' : ''}">
            <g class="scalable">
              <rect class="uml-class-name-rect"/> ${shadow ? '' : '<rect class="uml-class-attrs-rect"/>'}
            </g>
            <text class="uml-class-name-text"/> ${shadow ? '' : '<text class="uml-class-attrs-text"/>'}
          </g>`;
};

export class IowClassElement extends joint.shapes.uml.Class {
  markup = classMarkup(false);
}

export class ShadowClass extends joint.shapes.uml.Class {
  markup = classMarkup(true);
}
