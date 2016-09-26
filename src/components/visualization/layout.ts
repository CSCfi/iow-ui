import { IPromise, IQService, IQResolveReject } from 'angular';
import { Uri } from '../../services/uri';
import { layout as colaLayout } from './colaLayout';
import * as joint from 'jointjs';

export function layoutGraph($q: IQService, graph: joint.dia.Graph, directed: boolean, onlyNodeIds: Uri[]): IPromise<any> {
  if (directed && onlyNodeIds.length === 0) {
    // TODO directed doesn't support incremental layout

    return $q.when(
      joint.layout.DirectedGraph.layout(graph, {
        nodeSep: 100,
        edgeSep: 150,
        rankSep: 500,
        rankDir: "LR"
      })
    );
  } else {
    return $q((resolve: IQResolveReject<any>, reject: IQResolveReject<any>) => {
      colaLayout(graph, _.map(onlyNodeIds, id => id.uri))
        .then(() => resolve(), err => reject(err));
    });
  }
}
