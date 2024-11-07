/** @odoo-module **/ 
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";

export class DocumentManagementTab extends Component{
    static template = "cpm_odoo.PlanningDocumentManagementTab"
    
    setup(){
        this.page_data = useState({
            display_document_category_list:[],
            document_set_list:[]
        })

        this.loadData()

        onWillStart(()=>{
            
        })

        onMounted(()=>{
            
        })

        useEffect(()=>{
            
        })
    }

    async loadData(){
        this.page_data.display_document_category_list = await this.props.context_data.orm.call(
            'cpm_odoo.documents_document_category',
            'search_read',
            [
                [
                    ['display','=',true]
                ],
                [],
                0,8,"name"
            ]
        )

        
        this.page_data.document_set_list = await this.props.context_data.orm.call(
            'cpm_odoo.documents_document_set',
            'search_read',
            [
                [
                    
                ],
                [],
                0,8,"updated_at desc,name asc"
            ]
        )
    }

    async act_add_document(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Document Set',
            res_model: 'cpm_odoo.documents_document_set',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'current',
            context: { 'default_field': 'value' },  // Optional: default values for fields
        });
    }

    async act_add_category(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Document Category',
            res_model: 'cpm_odoo.documents_document_category',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'current',
            context: { 'default_field': 'value' },  // Optional: default values for fields
        });
    }

    async act_add_document_to_set(set_id){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Add New Document',
            res_model: 'cpm_odoo.documents_document',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'current',
            context: { 'default_set_id': set_id },  // Optional: default values for fields
        });
    }

    async act_show_more_document_categories(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_category_item_list',
            context: {}
        });
    }

    async act_show_more_document_sets(context_data){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: context_data
        });
    }

    async act_document_set_detail(document_set_id){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: {document_set_id:document_set_id}
        });
    }
}

class DocumentSetDetail extends Component{
    static template = "cpm_odoo.DocumentSetDetail"
}

registry.category("actions").add("cpm_odoo.document_set_detail", DocumentSetDetail);

class ItemList extends Component{
    static template = ""

    setup(){
        this.page_data = useState({
            item_list:[],
            item_count:0,
            item_display_count:2,
            current_page: 0,
            page_count:0,
            page_display_count:7,
            page_arr:[],
            model_name:"",
            column_list:[],//columns to get from model
            domain:[],
            order_by_str:""
        })

        this.orm = useService('orm')

        this.loadData()
    }

    async loadData(){
        let item_display_count = this.page_data.item_display_count
        let item_count = await this.orm.call(
            this.page_data.model_name,
            'search_count',
            [
                this.page_data.domain
            ]
        )

        this.page_data.item_count = item_count

        let page_count = Math.floor(item_count/item_display_count)
        if(item_count%item_display_count>0){
            page_count+=1
        }
        this.page_data.page_count = page_count
        this.act_load_page(0)
    }

    async act_load_page(page){
        if(this.page_data.page_count > page && page >= 0){
            this.page_data.current_page = page
            let item_list = await this.orm.call(
                this.page_data.model_name,
                'search_read',
                [
                    this.page_data.column_list,
                    this.page_data.domain,
                    this.page_data.current_page*this.page_data.item_display_count,this.page_data.item_display_count,this.page_data.order_by_str
                ]
            )
            
            this.get_page_list()
            
            this.page_data.item_list = item_list
        }
    }

    get_page_list(){
        let page_arr = Array.from({ length: this.page_data.page_display_count }, (_, i) => {
            const value = this.page_data.current_page - Math.floor(this.page_data.page_display_count/2) + i;
            return value
        });
        const lowerBound = 0;
        const upperBound = this.page_data.page_count-1;
        
        const belowZeroCount = page_arr.filter(value => value < 0).length;
        
        page_arr.forEach((val,idx)=>{
            page_arr[idx]+=belowZeroCount
        })

        page_arr = page_arr.filter(value => value <= upperBound);
        
        const aboveTenCount = page_arr.filter(value => value > upperBound).length;
        
        page_arr.forEach((val,idx)=>{
            page_arr[idx]-=aboveTenCount
        })
        
        page_arr = page_arr.filter(value => value >= lowerBound);
            
        this.page_data.page_arr = page_arr
    }
}

class DocumentCategoryItemList extends Component{
    static template = "cpm_odoo.DocumentCategoryItemList"

    setup(){
        this.page_data = useState({
            item_list:[],
            item_count:0,
            item_display_count:2,
            current_page: 0,
            page_count:0,
            page_display_count:7,
            page_arr:[]
        })

        this.orm = useService('orm')
        this.action = useService('action')

        this.loadData()
    }

    async act_load_page(page){
        if(this.page_data.page_count > page && page >= 0){
            this.page_data.current_page = page
            let item_list = await this.orm.call(
                'cpm_odoo.documents_document_category',
                'search_read',
                [
                    [
                        
                    ],
                    [],
                    this.page_data.current_page*this.page_data.item_display_count,this.page_data.item_display_count,"name asc"
                ]
            )
            
            this.get_page_list()
            
            this.page_data.item_list = item_list
        }
    }

    get_page_list(){
        let page_arr = Array.from({ length: this.page_data.page_display_count }, (_, i) => {
            const value = this.page_data.current_page - Math.floor(this.page_data.page_display_count/2) + i;
            return value
        });
        const lowerBound = 0;
        const upperBound = this.page_data.page_count-1;
        
        const belowZeroCount = page_arr.filter(value => value < 0).length;
        
        page_arr.forEach((val,idx)=>{
            page_arr[idx]+=belowZeroCount
        })

        page_arr = page_arr.filter(value => value <= upperBound);
        
        const aboveTenCount = page_arr.filter(value => value > upperBound).length;
        
        page_arr.forEach((val,idx)=>{
            page_arr[idx]-=aboveTenCount
        })
        
        page_arr = page_arr.filter(value => value >= lowerBound);
            
        this.page_data.page_arr = page_arr
    }

    async loadData(){
        let item_display_count = this.page_data.item_display_count
        let item_count = await this.orm.call(
            'cpm_odoo.documents_document_category',
            'search_count',
            [
                []
            ]
        )

        this.page_data.item_count = item_count

        let page_count = Math.floor(item_count/item_display_count)
        if(item_count%item_display_count>0){
            page_count+=1
        }
        this.page_data.page_count = page_count
        this.act_load_page(0)
    }

    async act_show_more_document_sets(context_data){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: context_data
        });
    }
}

registry.category("actions").add("cpm_odoo.document_category_item_list", DocumentCategoryItemList);

class DocumentSetItemList extends ItemList{
    static template = "cpm_odoo.DocumentSetItemList"

    setup(){
        this.page_data.model_name:"",
        this.page_data.column_list:[],//columns to get from model
        this.page_data.domain:[],
        this.page_data.order_by_str:""


        super.setup()
    }
}

registry.category("actions").add("cpm_odoo.document_set_item_list", DocumentSetItemList);