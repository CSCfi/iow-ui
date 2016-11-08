import { IHttpService, IPromise, IQService } from 'angular';
import { config } from '../../config';
import { Uri } from '../entities/uri';
import { Language } from '../utils/language';
import { normalizeAsArray, flatten } from '../utils/array';
import * as frames from '../entities/frames';
import { FrameService } from './frameService';
import { GraphData } from '../entities/contract';
import { ReferenceDataCode, ReferenceData, ReferenceDataServer } from '../entities/referenceData';

export class ReferenceDataService {

  // indexed by reference data id
  private referenceDataCodesCache = new Map<string, IPromise<ReferenceDataCode[]>>();

  /* @ngInject */
  constructor(private $http: IHttpService, private $q: IQService, private frameService: FrameService) {
  }

  getReferenceDataServers(): IPromise<ReferenceDataServer[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeServer'))
      .then(response => this.deserializeReferenceDataServers(response.data!));
  }

  getReferenceDatasForServer(server: ReferenceDataServer): IPromise<ReferenceData[]> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeList'), { params: { uri: server.id.uri } })
      .then(response => this.deserializeReferenceDatas(response.data!));
  }

  getReferenceDatasForServers(servers: ReferenceDataServer[]): IPromise<ReferenceData[]> {
    return this.$q.all(servers.map(server => this.getReferenceDatasForServer(server)))
      .then(referenceDatas => flatten(referenceDatas));
  }

  getAllReferenceDatas(): IPromise<ReferenceData[]> {
    return this.getReferenceDataServers().then(servers => this.getReferenceDatasForServers(servers));
  }

  getReferenceDataCodes(referenceData: ReferenceData|ReferenceData[]): IPromise<ReferenceDataCode[]> {

    const getSingle = (rd: ReferenceData) => {
      const cached = this.referenceDataCodesCache.get(rd.id.uri);

      if (cached) {
        return cached;
      } else {
        const result = this.$http.get<GraphData>(config.apiEndpointWithName('codeValues'), {params: {uri: rd.id.uri}})
          .then(response => this.deserializeReferenceDataCodes(response.data!));

        this.referenceDataCodesCache.set(rd.id.uri, result);
        return result;
      }
    };

    const internalReferenceData = normalizeAsArray(referenceData).filter(rd => !rd.isExternal());

    return this.$q.all(internalReferenceData.map(rd => getSingle(rd))).then(flatten);
  }

  newReferenceData(uri: Uri, label: string, description: string, lang: Language): IPromise<ReferenceData> {
    return this.$http.get<GraphData>(config.apiEndpointWithName('codeListCreator'), {params: {uri: uri.uri, label, description, lang}})
      .then(response => this.deserializeReferenceData(response.data!));
  }

  private deserializeReferenceDataServers(data: GraphData): IPromise<ReferenceDataServer[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataServerFrame(data), () => ReferenceDataServer);
  }

  private deserializeReferenceData(data: GraphData): IPromise<ReferenceData> {
    return this.frameService.frameAndMap(data, true, frames.referenceDataFrame(data), () => ReferenceData);
  }

  private deserializeReferenceDatas(data: GraphData): IPromise<ReferenceData[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataFrame(data), () => ReferenceData);
  }

  private deserializeReferenceDataCodes(data: GraphData): IPromise<ReferenceDataCode[]> {
    return this.frameService.frameAndMapArray(data, frames.referenceDataCodeFrame(data), () => ReferenceDataCode);
  }
}
