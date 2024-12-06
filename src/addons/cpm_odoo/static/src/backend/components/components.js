/** @odoo-module **/ 
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { joinDatas } from "./component_utils";

export class GanttDisplay extends Component{
    static template = "cpm_odoo.cmp_schedule_display"
    // inputs:
    // context_params
    // state_data
    setup(){
        this.component_context = {
            display_size:{
                width:"100%",
                height:"60vh"
            }
        }
        this.gantt_graph_display = useRef("gantt_graph_display")

        this.graph_data = {
            data:[],
            links:[]
        }

        let display_size = this.props.context_params.display_size
        if(display_size!==undefined){
            if(display_size.width!==undefined){
                this.component_context.display_size.width = display_size.width   
            }
            if(display_size.height!==undefined){
                this.component_context.display_size.height = display_size.height
            }
        }
    
        onWillStart(()=>{
            
        })

        onMounted(()=>{
            this._setup_graph()
        })

        useEffect(()=>{
            this._update_graph_data()

            gantt.clearAll();
            gantt.parse({
                data: this.graph_data.data,
                links:this.graph_data.links
            });
        })
    }

    setup_graph(){
    }

    _setup_graph(){
        gantt.config.date_format = "%Y-%m-%d";
        gantt.init(this.gantt_graph_display.el);

        gantt.config.scales = [
            {
                format : "%m/%y",
                unit : "month",
                step: 1
            },
            {
                unit: "week", 
                step: 2, 
                date: "Week %W"
            }
        ]

        gantt.config.layout = {
            css: "gantt_container",
            rows:[
                {
                    cols: [
                    {
                        // the default grid view  
                        view: "grid",  
                        scrollX:"scrollHor", 
                        scrollY:"scrollVer"
                    },
                    { resizer: true, width: 1 },
                    {
                        // the default timeline view
                        view: "timeline", 
                        scrollX:"scrollHor", 
                        scrollY:"scrollVer"
                    },
                    {
                        view: "scrollbar", 
                        id:"scrollVer"
                    }
                ]},
                {
                    view: "scrollbar", 
                    id:"scrollHor"
                }
            ]
        }

        gantt.config.min_column_width = 100;

        gantt.config.drag_move = false;     
        gantt.config.drag_resize = false;   
        gantt.config.drag_progress = false;
        gantt.config.drag_links = false;

        this.setup_graph()
    }

    _update_graph_data(){
        this.update_graph_data()
    }

    update_graph_data(){
    }
}

export class SearchBar extends Component{
    static template = "cpm_odoo.cmp_search_bar"
    


    setup(){
        this.kw = ""
        this.search_bar_el = useRef('search-bar')

        onMounted(()=>{
            this.bind_keys()
        })
    }

    act_search(){
        this.kw = this.search_bar_el.el.value
        this.search_bar_el.el.value = ""
        this.props.act_search(this.props.inst, this.kw)
    }

    bind_keys(){
        this.search_bar_el.el.addEventListener("keydown", 
            (event) => {
                if (event.key === "Enter") {
                    this.act_search();
                }
            }
        );
    }
}

export class ItemList extends Component{
    static template = ""
    static components = {
        SearchBar
    }
    

    init(){
        if(!this.page_data){
            this.page_data = useState({
                item_list:[],
                item_count:0,
                current_page: 0,
                page_count:0,
                item_display_count:24,
                page_display_count:7,
                page_arr:[],
                model_name:"",
                column_list:[],//columns to get from model
                rel_column_list:[],
                domain:[],
                extra_domain:[],
                order_by_str:"",
                join_cols:[],
                updated_at:0
            })
            
            if(this.props.extra_domain){
                this.page_data.extra_domain = this.props.extra_domain
            }
    
            this.search_filter = useState({
                search_bar:{
                    cols:[],
                    kw:[""]
                },
                filters:[]
            })
    
            this.orm = useService('orm')

            useEffect(()=>{
                this.act_setup_list()
            },
            ()=>[this.page_data.extra_domain])
        }

        if (this.props.page_data){
            let page_data = this.props.page_data
            if(page_data.item_display_count)
                this.page_data.item_display_count = page_data.item_display_count
            if(page_data.page_display_count)
                this.page_data.page_display_count = page_data.page_display_count
        }
    }

    setup(){
        this.init()

        this.act_setup_list()
    }

    async act_setup_list(){
        let domain = []
        if (this.page_data.domain){
            this.page_data.domain.forEach((item)=>{
                domain.push(item)
            })
        }
        if (this.page_data.extra_domain && this.page_data.extra_domain.length > 0){
            this.page_data.extra_domain.forEach((item)=>{
                domain.push(item)
            })
        }
        let item_display_count = this.page_data.item_display_count
        let item_count = await this.orm.call(
            this.page_data.model_name,
            'search_count',
            [
                domain,
            ]
        )

        this.page_data.item_count = item_count

        let page_count = Math.floor(item_count/item_display_count)
        if(item_count%item_display_count>0){
            page_count+=1
        }
        this.page_data.page_count = page_count
        await this.act_load_page(0)
    }

    async act_load_page(page){
        if((this.page_data.page_count > page || this.page_data.page_count === 0) && page >= 0){
            let domain = []
            if (this.page_data.domain){
                this.page_data.domain.forEach((item)=>{
                    domain.push(item)
                })
            }
            if (this.page_data.extra_domain && this.page_data.extra_domain.length > 0){
                this.page_data.extra_domain.forEach((item)=>{
                    domain.push(item)
                })
            }
            const now = Date.now();
            
            // if(this.page_data.model_name === "cpm_odoo.human_res_staff"){
            //     console.log(this.page_data.extra_domain,domain,now)
            // }
            this.page_data.current_page = page
            let item_list = await this.orm.call(
                this.page_data.model_name,
                'search_read',
                [
                    domain,
                    this.page_data.column_list,
                    this.page_data.current_page*this.page_data.item_display_count,
                    this.page_data.item_display_count,
                    this.page_data.order_by_str
                ]
            )

            if(this.page_data.join_cols.length>0){
                await joinDatas(item_list,this.orm,this.page_data.join_cols)
            }

            this.get_page_list()
            if(this.page_data.updated_at<now){
                this.page_data.updated_at=now
                await this.append_to_list(item_list)
                this.page_data.item_list = item_list
            }
        }
    }

    act_search(inst,kw){
        let new_kw = [kw]
        // let new_kw = kw.split(" ")

        // if(new_kw.length<4){
        //     new_kw
        // }
        // else{
        //     new_kw = kw
        // }

        inst.search_filter.search_bar.kw = new_kw

        inst.generate_domain()

        inst.act_setup_list()
    }

    act_filter(inst,col_name,selected_items){
        if(selected_items.includes('null') && selected_items.length === 1){
            inst.search_filter.filters[col_name] = {
                col_name:col_name,
                items:null
            }
    
            inst.generate_domain()
    
            inst.act_setup_list()
        }
        else{
            inst.search_filter.filters[col_name] = {
                col_name:col_name,
                items:selected_items
            }
    
            inst.generate_domain()
    
            inst.act_setup_list()
        }
    }

    act_order(){

    }

    generate_domain(){
        let new_domain = []

        if(!this.search_filter.search_bar.kw.includes('')){        
            this.search_filter.search_bar.cols.forEach((col,col_idx)=>{
                this.search_filter.search_bar.kw.forEach((kw,kw_idx)=>{
                    if(kw_idx+1<this.search_filter.search_bar.kw.length){
                        new_domain.push("&")
                    }
                    new_domain.push([col,"ilike",kw])
                })
                // if(col_idx+1<this.search_filter.search_bar.cols.length){
                //     new_domain.push("&")
                // }
            })
        }

        const filters = this.search_filter.filters
        const keyCount = Object.keys(filters).length
        for(const [idx,key] of Object.keys(filters).entries()){
            if(filters[key].items){
                new_domain.push([filters[key].col_name,'in',filters[key].items])
                // if(idx<keyCount){
                //     new_domain.push("&")
                // }
            }
        }
        
        this.page_data.domain = new_domain
    }

    async append_to_list(item_list){

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

export class ListFilter extends Component{
    static template = "cpm_odoo.cmp_select_filter"
    setup(){
        this.state_data = useState({
            item_list:[],
            selected_items:[]
        })

        useEffect(
            ()=>{
                this.state_data.item_list = this.props.item_list
            },
            ()=>[this.props.item_list]
        )
        this.col_name = this.props.col_name
    }

    act_filter(){
        this.state_data.selected_items.forEach((item,idx)=>{
            if(item!="null"){
                this.state_data.selected_items[idx]=parseInt(item)?parseInt(item):item
            }
        })
        this.props.act_filter(this.props.inst,this.col_name,this.state_data.selected_items)
    }
}