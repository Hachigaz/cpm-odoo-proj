/** @odoo-module **/
import { ItemList, ListFilter, SearchBar} from "../../components/components";
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime} from "../../components/component_utils";
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";

export class ImportRecordItemList extends ItemList{
    static page_name='cpm_odoo.ImportRecordItemList'
    static template="cpm_odoo.ImportRecordItemList"
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
            this.page_data.model_name = 'cpm_odoo.logistics_eqp_imp_rec'
        }else{
            this.current_render_content = 'mat'
            this.page_data.model_name = 'cpm_odoo.logistics_mat_imp_rec'
        }
        this.page_data.column_list = ['id','created_by','date_created','imp_det_ids','is_verified']
        this.page_data.order_by_str = "date_created desc"
        this.page_data.join_cols =[
            
        ]
        this.search_filter.search_bar.cols=["name"]
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        this.action = useService("action")
        
        super.setup()
    }
    
    async act_create_new_mat_import_record(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Import Record',
            res_model: 'cpm_odoo.logistics_mat_imp_rec',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
        });
    }

    async act_create_new_eqp_import_record(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'New Import Record',
            res_model: 'cpm_odoo.logistics_eqp_imp_rec',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_warehouse_id': this.props.context_data.warehouse_info.id },  // Optional: default values for fields
        });
    }

    async act_verify_record_detail(opt,id){
        if(opt==="mat"){
            await this.orm.call(
                "cpm_odoo.logistics_mat_imp_rec",
                "act_verify_record",
                [
                    id
                ]
            )
            window.location.reload()
        }
        else if(opt==="eqp"){
            await this.orm.call(
                "cpm_odoo.logistics_eqp_imp_rec",
                "act_verify_record",
                [
                    id
                ]
            )
            window.location.reload()
        }
    }

    async act_view_record_detail(opt,id){
        if(opt==="mat"){
            await this.action.doAction({
                type: 'ir.actions.act_window',
                name: 'Record Details',
                res_model: 'cpm_odoo.logistics_mat_imp_rec',
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
                res_model: 'cpm_odoo.logistics_eqp_imp_rec',
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
                res_model: 'cpm_odoo.logistics_mat_imp_rec',
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
                res_model: 'cpm_odoo.logistics_mat_imp_rec',
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
                "cpm_odoo.logistics_mat_imp_rec",
                "unlink",
                [
                    id
                ]
            )
            storePageInfo(this.constructor.page_name,{
                'current_render_content':'mat'
            })
            window.location.reload()
        }
        else if(opt==="eqp"){
            if(!confirm("Delete Record?")){
                return
            }
            this.orm.call(
                "cpm_odoo.logistics_eqp_imp_rec",
                "unlink",
                [
                    id
                ]
            )
            storePageInfo(this.constructor.page_name,{
                'current_render_content':'eqp'
            })
            window.location.reload()
        }
    }

    async act_render_contents(opt){
        if(opt==="mat"){
            this.page_data.model_name = 'cpm_odoo.logistics_mat_imp_rec'
            this.current_render_content = 'mat'
            this.act_setup_list()
        }
        else{
            this.page_data.model_name = 'cpm_odoo.logistics_eqp_imp_rec'
            this.current_render_content = 'eqp'
            this.act_setup_list()
        }
    }
}

export class WarehouseImportsUI extends Component{
    static page_name="warehouse_import_ui"
    static template="cpm_odoo.WarehouseImportsUI"
    static components={
        ImportRecordItemList
    }

    setup(){
        
    }

    async loadData(){

    }

    async loadFilterData(){

    }
}