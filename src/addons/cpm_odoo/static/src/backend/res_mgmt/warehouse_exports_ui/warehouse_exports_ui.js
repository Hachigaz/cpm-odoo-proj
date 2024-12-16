/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";


export class ExportRecordItemList extends ItemList{
    static page_name='cpm_odoo.ExportRecordItemList'
    static template="cpm_odoo.ExportRecordItemList"
    static components={
        SearchBar,
        ListFilter
    }

    static formatDateTime = formatDateTime
    setup(){
        super.init()
        const pageInfo = getPageInfo(this.constructor.page_name)
        if(pageInfo && pageInfo.current_render_content==="eqp"){
            this.current_render_content = 'eqp'
            this.page_data.model_name = 'cpm_odoo.logistics_eqp_exp_rec'
        }else{
            this.current_render_content = 'mat'
            this.page_data.model_name = 'cpm_odoo.logistics_mat_exp_rec'
        }
        this.page_data.column_list = []
        this.page_data.order_by_str = "date_created desc"
        this.page_data.join_cols =[
            ['created_by','cpm_odoo.human_res_staff',['id','name']],
            ['delivered_by','cpm_odoo.human_res_staff',['id','name']]
        ]
        this.search_filter.search_bar.cols=["name"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        this.filter_data = [
            {
                col_name:"eqp_type_id",
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
    
    async act_create_new_mat_export_record(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Export Record',
            res_model: 'cpm_odoo.logistics_mat_exp_rec',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
        });
    }

    async act_create_new_eqp_export_record(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Export Record',
            res_model: 'cpm_odoo.logistics_eqp_exp_rec',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
        });
    }

    async act_view_record_detail(opt,id){
        if(opt==="mat"){
            await this.action.doAction({
                type: 'ir.actions.act_window',
                name: 'Record Details',
                res_model: 'cpm_odoo.logistics_mat_exp_rec',
                res_id: id,
                view_mode: 'form',
                views: [[false, 'form']],
                target: 'new',
                context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
            });
        }
        else if(opt==="eqp"){
            await this.action.doAction({
                type: 'ir.actions.act_window',
                name: 'Record Details',
                res_model: 'cpm_odoo.logistics_eqp_exp_rec',
                res_id: id,
                view_mode: 'form',
                views: [[false, 'form']],
                target: 'new',
                context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
            });
        }
    }

    async act_edit_record_detail(opt,id){
        if(opt==="mat"){
            await this.action.doAction({
                type: 'ir.actions.act_window',
                name: 'Edit Record',
                res_model: 'cpm_odoo.logistics_mat_exp_rec',
                res_id: id,
                view_mode: 'form',
                views: [[false, 'form']],
                target: 'new',
                context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },
            });
        }
        else if(opt==="eqp"){
            await this.action.doAction({
                type: 'ir.actions.act_window',
                name: 'Record Details',
                res_model: 'cpm_odoo.logistics_eqp_exp_rec',
                res_id: id,
                view_mode: 'form',
                views: [[false, 'form']],
                target: 'new',
                context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
            });
        }
    }

    async act_delete_record_detail(opt,id){
        if(opt==="mat"){
            if(!confirm("Delete Record?")){
                return
            }
            this.orm.call(
                "cpm_odoo.logistics_mat_exp_rec",
                "unlink",
                [
                    id
                ]
            )
            window.location.reload()
        }
        else if(opt==="eqp"){
            if(!confirm("Delete Record?")){
                return
            }
            this.orm.call(
                "cpm_odoo.logistics_eqp_exp_rec",
                "unlink",
                [
                    id
                ]
            )
            window.location.reload()
        }
    }

    async act_verify_record_detail(opt,id){
        if(!confirm("Verify record?")){
            return
        }
        if(opt==="mat"){
            await this.orm.call(
                "cpm_odoo.logistics_mat_exp_rec",
                "act_verify_record",
                [
                    id
                ]
            )
            window.location.reload()
        }
        else if(opt==="eqp"){
            await this.orm.call(
                "cpm_odoo.logistics_eqp_exp_rec",
                "act_verify_record",
                [
                    id
                ]
            )
            window.location.reload()
        }
    }

    async act_mark_delivered(opt,id){
        if(!confirm("Mark record as delivered?")){
            return
        }
        if(opt==="mat"){
            await this.orm.call(
                "cpm_odoo.logistics_mat_exp_rec",
                "act_mark_delivered",
                [
                    id
                ]
            )
            window.location.reload()
        }
        else if(opt==="eqp"){
            await this.orm.call(
                "cpm_odoo.logistics_eqp_exp_rec",
                "act_mark_delivered",
                [
                    id
                ]
            )
            window.location.reload()
        }
    }

    async act_render_contents(opt){
        if(opt==="mat"){
            this.page_data.model_name = 'cpm_odoo.logistics_mat_exp_rec'
            this.current_render_content = 'mat'
            this.act_setup_list()
        }
        else{
            this.page_data.model_name = 'cpm_odoo.logistics_eqp_exp_rec'
            this.current_render_content = 'eqp'
            this.act_setup_list()
        }
        storePageInfo(this.constructor.page_name,{
            'current_render_content':this.current_render_content
        })
    }
}

export class WarehouseExportsUI extends Component{
    static page_name="warehouse_export_ui"
    static template="cpm_odoo.WarehouseExportsUI"
    static components={
        ExportRecordItemList
    }

    setup(){
        
    }

    async loadData(){

    }

    async loadFilterData(){

    }
}