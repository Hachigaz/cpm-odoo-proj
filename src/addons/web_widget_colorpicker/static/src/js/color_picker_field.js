/** @odoo-module **/
import { Component, onWillStart, onMounted, onWillUnmount, onWillRender, useEffect, xml, useState, useRef } from "@odoo/owl";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { useInputField } from "@web/views/fields/input_field_hook";
import {_lt, _t} from "@web/core/l10n/translation";
import { loadJS } from "@web/core/assets";


// Import the registry
import {registry} from "@web/core/registry";


export class FieldColorPicker extends Component {

    static template = "web_widget_colorpicker.FieldColorPicker";
    static props = {
        ...standardFieldProps,
        // fieldName: {type: String, optional: true},
    };

    elRef = useRef("el");
    inputRef = useRef("ColorChar");

    setup() {

        useInputField({
            getValue: () => this.props.record.data[this.props.name] || "",
            parse: (v) => this.parse(v),
        });

        onWillStart(async () => {
            await loadJS('/web_widget_colorpicker/static/src/lib/bootstrap-colorpicker/js/bootstrap-colorpicker.js');
        });

        onMounted(()=> {

            this.el = this.elRef.el;
            this.$el = $(this.el);

            var show_value = this.value;

            if (this.props.readonly) {
                this.$el.text(show_value);
                this.$el.css("background-color", show_value);
            }
            var self = this

            //if not readonly
            if (!this.props.readonly) {
                var $input = this.$el.find('input');
                $input.val(show_value);
                // clolorpicker allow to paste own color value like #ff0000 or rgba(255,0,0,0.5)

                this.$el.colorpicker({format: 'rgba', color : show_value}).on('changeColor', function(e) {
                    // $input.val(e.color.toHex());

                    var val = e.color.toRGB();
                    //conver object (a = 0.54,b = 34, g = 35, r = 23) to string like that rgba(170,170,13,0.53)
                    val = "rgba(" + val.r + "," + val.g + "," + val.b + "," + val.a + ")";
                    $input.val(val);
                    self.saveDvalue(self, val);
                });
            }
        });
    super.setup();
    }

    saveDvalue($self, newValue) {
        let isOk = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i.test(newValue);
        if (isOk) {
            $self.props.record.update({ [$self.props.name]: newValue });
        }
    }
    // get maxLength() {
    //     return this.props.record.fields[this.props.name].size;
    // }
    get formattedValue() {
        return this.value;
    }

    get value() {
        return this.props.record.data[this.props.name];
    }
    parse(value) {
        return value;
    }
}


export const fieldColorPicker = {
    component: FieldColorPicker,
    displayName: _lt("Color Picker Field"),
    // extractProps: ({ attrs, options }) => ({
    //     options: options,
    // }),
    supportedTypes: ["char"]
}

// Add the field to the correct category
registry.category("fields").add("colorpicker", fieldColorPicker);

