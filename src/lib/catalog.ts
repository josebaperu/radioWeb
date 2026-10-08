import tsv from '../../stations.tsv?raw'
import { parseStations } from './stations.ts'

export const stations = parseStations(tsv)
