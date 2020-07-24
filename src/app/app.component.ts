import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProvider from 'bpmn-js-properties-panel/lib/provider/camunda';
import { CamundaModdleDescriptor } from './CamundaModdleDescriptor';
import customTranslate from './customTranslate/customTranslate';
import paletteProvider from './custom-palette';
import contextPadProvider from './context-pad';
import * as xml2js from 'xml2js';

const defaultXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                   xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="sample-diagram"
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public modeler: any;
  public state = {
    scale: 1 // 流程图比例
  };
  public element: any; // 所选节点中的第一个节点
  ngOnInit() {
    const customTranslateModule = {
      translate: ['value', customTranslate]
    };
    this.modeler = new BpmnModeler({
      container: '#el',
      propertiesPanel: {
        parent: '#js-properties-panel'
      },
      additionalModules: [
        propertiesProvider,
        propertiesPanelModule,
        customTranslateModule,
        paletteProvider,
        contextPadProvider
      ],
      moddleExtensions: {
        camunda: CamundaModdleDescriptor
      }
    });
    this.modeler.importXML(defaultXML);
    this.modeler.on('selection.changed', (e) => {
      this.element = e.newSelection[0];
    });
    this.modeler.on('element.changed', (e) => {
      this.element = e.element;
    });
  }
  selected(value) {
    const modeling = this.modeler.get('modeling');
    modeling.updateProperties(this.element, {
      'custom-property': value
    });
    // 节点改变颜色
    modeling.setColor(this.element, {
      fill: 'yellow',
      stroke: 'orange'
    })
  }
  /**
  * 下载xml/svg
  *  @param  type  类型  svg / xml
  *  @param  data  数据
  *  @param  name  文件名称
  */
  download = (type, data, name) => {
    let dataTrack = '';
    const a = document.createElement('a');

    switch (type) {
      case 'xml':
        dataTrack = 'bpmn';
        break;
      case 'svg':
        dataTrack = 'svg';
        break;
      default:
        break;
    }

    name = name || `diagram.${dataTrack}`;

    a.setAttribute('href', `data:application/bpmn20-xml;charset=UTF-8,${encodeURIComponent(data)}`);
    a.setAttribute('target', '_blank');
    a.setAttribute('dataTrack', `diagram:download-${dataTrack}`);
    a.setAttribute('download', name);

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  // 前进
  handleRedo = () => {
    this.modeler.get('commandStack').redo();
  };

  // 后退
  handleUndo = () => {
    this.modeler.get('commandStack').undo();
  };

  // 下载SVG格式
  handleDownloadSvg = () => {
    this.modeler.saveSVG({ format: true }, (err, data) => {
      this.download('svg', data, 'svg');
    });
  };

  // 下载XML格式
  handleDownloadXml = () => {
    this.modeler.saveXML({ format: true }, (err, data) => {
      this.download('xml', data, 'xml');
    });
  };

  // 流程图放大缩小
  handleZoom = (radio) => {
    const newScale = !radio
      ? 1.0 // 不输入radio则还原
      : this.state.scale + radio <= 0.2 // 最小缩小倍数
        ? 0.2
        : this.state.scale + radio;

    this.modeler.get('canvas').zoom(newScale);
    this.state.scale = newScale;
  };


  // 保存
  handleSave() {
    console.log('save');
    this.modeler.saveXML({ format: true }, async (err, xml) => {
      console.log(xml);
      const parseString = xml2js.parseString;
      parseString(xml, (err, result) => {
        const bpmnData = result['bpmn2:definitions']['bpmn2:process'][0];
        if (!bpmnData['bpmn2:startEvent'] || !bpmnData['bpmn2:endEvent']) {
          alert('一个流程图必须有一个开始和结束节点');
        }
      });
    });
  }
}
