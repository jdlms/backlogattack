/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    AllTitles: {
      name: string
      type: "sst.aws.Function"
    }
    Backlogattack: {
      type: "sst.aws.Remix"
      url: string
    }
    Steam: {
      name: string
      type: "sst.aws.Dynamo"
    }
  }
}
export {}