/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

export class EqpStorageRecordItemList extends ItemList{
    static page_name='cpm_odoo.EqpStorageRecordItemList'
    static template="cpm_odoo.EqpStorageRecordItemList"
    static components={
        SearchBar,
        ListFilter
    }

    static formatDateTime = formatDateTime
    setup(){
        super.init()
        this.page_data.model_name = 'cpm_odoo.res_mgmt_eqp_storage_rec'
        this.page_data.column_list = ['id','equipment_id','amount']
        this.page_data.order_by_str = ""
        this.page_data.join_cols =[
            ['equipment_id','cpm_odoo.res_mgmt_equipment',['id','name','eqp_type_id']],
            ['equipment_id.eqp_type_id','cpm_odoo.res_mgmt_eqp_type',['id','name','color']]
        ]
        this.search_filter.search_bar.cols=["equipment_id.name"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        this.filter_data = [
            {
                col_name:"equipment_id.eqp_type_id",
                item_list:[]
            }
        ]

        this.loadData()
        
        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.res_mgmt_eqp_type",
            "search_read",
            [
                [

                ],
                [
                    "id","name"
                ],
                0,0,
                "name asc"
            ]
        )
    }

}
export class MatStorageRecordItemList extends ItemList{
    static page_name='cpm_odoo.MatStorageRecordItemList'
    static template="cpm_odoo.MatStorageRecordItemList"
    static components={
        SearchBar,
        ListFilter
    }

    static formatDateTime = formatDateTime
    setup(){
        super.init()
        this.page_data.model_name = 'cpm_odoo.res_mgmt_mat_storage_rec'
        this.page_data.column_list = ['id','material_id','amount']
        this.page_data.order_by_str = ""
        this.page_data.join_cols =[
            ['material_id','cpm_odoo.res_mgmt_material',['id','name','mat_type_id']],
            ['material_id.mat_type_id','cpm_odoo.res_mgmt_mat_type',['id','name','color']]
        ]
        this.search_filter.search_bar.cols=["material_id.name"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        this.filter_data = [
            {
                col_name:"material_id.mat_type_id",
                item_list:[]
            }
        ]

        this.loadData()
        
        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.res_mgmt_mat_type",
            "search_read",
            [
                [

                ],
                [
                    "id","name"
                ],
                0,0,
                "name asc"
            ]
        )
    }

}

export class WarehouseInfoUI extends Component{
    static page_name="warehouse_info_ui"
    static template="cpm_odoo.WarehouseInfoUI"
    static components={
        EqpStorageRecordItemList,
        MatStorageRecordItemList
    }

    setup(){
        this.tabs = ["material",'equipment']

        onMounted(()=>{
            this.showTab(this.tabs[0])
        })
    }

    async loadData(){

    }

    async loadFilterData(){

    }

    async showTab(tab_name){
        this.current_tab = tab_name
        for (const tab of this.tabs){
            document.querySelector(`.tab-panels .${tab}-stock-tab`).classList.add('d-none')
        }
        document.querySelector(`.tab-panels .${this.current_tab}-stock-tab`).classList.remove('d-none')
    }
}