import { QuerySchemaType, MetaDataBody } from '../../../shared/shared.type';
import mongoose from 'mongoose';


export interface AppMenuType {
    _id?: mongoose.Types.ObjectId;
    appMenuId?: mongoose.Types.ObjectId;
    name?: string;
    hasSubMenus: boolean;
    description?: string;
    appAccessGroupIds?: mongoose.Types.ObjectId[];
    url?: string | null;
    isDeleted?: boolean;
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    isAdded?: boolean;
    updateOne?: any;
    sequenceNumber?: any;
}

export interface AppSubMenuType {
    _id?: mongoose.Types.ObjectId;
    appSubMenuId?: mongoose.Types.ObjectId;
    name: string;
    description: string;
    url?: string | null;
    isDeleted?: boolean,
    __v?: number;
    createdAt?: Date;
    updatedAt?: Date;
    isAdded?: boolean;
    updateOne?: any;
    save?: any
    sequenceNumber?: any;
}

export interface CreateAppMenuType {
    name: string;
    description: string;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    hasSubMenus: boolean;
    url: string | boolean;
    isDeleted: boolean;
}

export interface GetAppMenuType {
    appMenuId: mongoose.Types.ObjectId;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    search: string;
    hasSubMenus: boolean;
    url: string | boolean;
    checkAppAccessGroupIds: mongoose.Types.ObjectId[];
    metaData: MetaDataBody
    isDeleted: boolean;
}

export interface UpdateAppMenuType {
    appMenuId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    appAccessGroupIds: mongoose.Types.ObjectId[];
    hasSubMenus: boolean;
    url: string;
    isDeleted: boolean;
}

export interface ToggleAppAccessGroupType {
    appMenuId: mongoose.Types.ObjectId;
    appAccessGroupIds: mongoose.Types.ObjectId[],
    toggleAction: string,
}

export interface DeleteAppMenuType {
    appMenuIds: mongoose.Types.ObjectId[];
}

export interface AppMenuQuery extends QuerySchemaType {
    $or?: Array<mongoose.FilterQuery<AppMenuType>>;
}

export interface CreateAppSubMenuType {
    appMenuId: mongoose.Types.ObjectId,
    appSubMenus: AppSubMenuType[],
    isDeleted: boolean,
};

export interface GetAppSubMenuType {
    appMenuId: mongoose.Types.ObjectId | null;
    appSubMenuId: mongoose.Types.ObjectId | null;
    search: string | null;
    metaData: MetaDataBody;
    isDeleted: boolean;
};

export interface UpdateAppSubMenuType {
    appSubMenuId: mongoose.Types.ObjectId;
    appMenuId: mongoose.Types.ObjectId;
    name: string,
    description: string,
    url: string,
};

export interface DeleteAppSubMenuType {
    appSubMenuIds: mongoose.Types.ObjectId[],
};

export interface AppSubMenuQuery extends QuerySchemaType {
    appMenuId?: mongoose.Types.ObjectId;
    $or?: Array<mongoose.FilterQuery<AppSubMenuType>>;
}

export interface PreviewMenueType {
    appAccessGroupIds: mongoose.Types.ObjectId[];
}

export interface SeralizeAppMenuType {
    sequenceOrder: {
        appMenuId: mongoose.Types.ObjectId;
        sequenceNumber: number;
        appSubMenus: {
            appSubMenuId: mongoose.Types.ObjectId,
            sequenceNumber: number,
        }[];
    }[];
}