require('normalize.css/normalize.css');
require('styles/App.less');
var unitImage = require('../images/箭头.png');
var imagesDates = require('../data/imageData.json');

import React from 'react';
import ReactDOM from 'react-dom';

// 利用自执行函数，将图片名信息转成图片URL路径信息
imagesDates = (function genImageURL(imageDataArr) {
	for (let i = 0, j = imageDataArr.length; i < j; i ++) {
		let singleImageData = imageDataArr[i];

		singleImageData.imageURL = require('../images/' + singleImageData.fileName);

		imageDataArr[i] = singleImageData;
	}

	return imageDataArr;
})(imagesDates);

/**
 * 获取区间内的随机值
 */
function getRangeRandom(low, high) {
	return Math.ceil(Math.random()*(high - low) + low);
}

/**
 * 获取0-30度之间的任意正负值
 */
function get30DegRandom() {
	return ((Math.random() > 0.5 ? '' : '-') + Math.ceil(Math.random() * 30));
}

class ImgFigure extends React.Component {
	/**
	 * imgFigure的点击处理函数
	 */
	handleClick(e) {
		if(this.props.arrange.isCenter) {
			this.props.inverse();
		} else {
			this.props.center();
		}
		
		e.preventDefault();
		e.stopPropagation();
	}

  render() {
  	var styleObj = {};

  	// 如果props属性中指定了这张图片的位置，则使用该属性设定位置
  	if (this.props.arrange.pos) {
  		styleObj = this.props.arrange.pos;
  	}

  	// 如果图片的旋转角度有值且不为0，添加旋转角度
  	if (this.props.arrange.rotate) {
  		// 保证兼容性
  		(['MozTransform', 'msTransform', 'WebkitTransform', 'transform']).forEach(function(value){
  			styleObj[value] = 'rotate(' + this.props.arrange.rotate + 'deg)';
  		}.bind(this));
  	}

  	if (this.props.arrange.isCenter) {
  		styleObj.zIndex = '11';
  	}

  	var imgFigureClassName = 'img-figure';
  	imgFigureClassName += (this.props.arrange.isInverse ? ' is-inverse' : '');

    return (
      	<figure className={imgFigureClassName} style={styleObj}>
					<img src={this.props.data.imageURL} alt={this.props.data.title} onClick={this.handleClick.bind(this)}/>
					<figcaption>
						<h2 className="img-title">{this.props.data.title}</h2>
						<div className="img-back" onClick={this.handleClick.bind(this)}>
							<p>
								{this.props.data.desc}
							</p>
						</div>
					</figcaption>
				</figure>
    );
  }
}

class ControllerUnit extends React.Component {
	handleClick(e) {
		// 如果点击的是当前正在选中态的按钮，则翻转图片，否则将对应的图片居中
		if (this.props.arrange.isCenter) {
			this.props.inverse();
		} else {
			this.props.center();
		}

		e.preventDefault();
		e.stopPropagation();
	}

	render() {
		var controllerUnitClassName = 'controller-unit';
		// 如果对应的是居中的图片，显示控制按钮的居中态
		if (this.props.arrange.isCenter) {
			controllerUnitClassName += ' is-center';

			// 如果同时对应图片的翻转，显示控制按钮的翻转态
			if (this.props.arrange.isInverse) {
				controllerUnitClassName += ' is-inverse';
			}
		}
		
		return (
			<span className={controllerUnitClassName} onClick={this.handleClick.bind(this)}>
				<img src={unitImage}/>
			</span>
		);
	}
}

class AppComponent extends React.Component {
	constructor(props) {
    super(props);
    this.Constant = {
			centerPos: {	// 中心点
				left: 0,
				right: 0
			},
			hPosRange: { // 水平方向的取值范围
				leftSecX: [0,0],
				rightSecX: [0,0],
				y: [0,0]
			},
			vPosRange: { // 垂直方向的取值范围
				x: [0,0],
				topY: [0,0]
			}
		};
    this.state = {
    	imgsArrangeArr: [
    		{
    			// pos: {
    			// 	left: "0",
    			// 	top: "0"
    			// },
    			// rotate: 0,	// 旋转角度
    			// isInverse: false, 	// 图片正反面
    			// isCenter: false		// 图片是否居中
    		}
    	]
    };
  }

  /**
   * 翻转图片
   * @param index 输入当前被执行inverse操作的图片对应的图片信息数组的值
   * @return {function} 闭包，返回一个真正执行的函数
   */
  inverse(index) {
  	return function() {
  		var imgsArrangeArr = this.state.imgsArrangeArr;
  		imgsArrangeArr[index].isInverse = !imgsArrangeArr[index].isInverse;

  		this.setState({
  			imgsArrangeArr: imgsArrangeArr
  		});
  	}.bind(this);
  }

	// 重新布局所有的图片
	/**
	 * 重新布局所有的图片
	 * @param  {[type]} centerIndex [指定居中排布哪一个图片]
	 */
	rearrange(centerIndex) {
		var imgsArrangeArr = this.state.imgsArrangeArr,
				Constant = this.Constant,
				centerPos = Constant.centerPos,
				hPosRange = Constant.hPosRange,
				vPosRange = Constant.vPosRange,
				hPosRangeLeftSecX = hPosRange.leftSecX,
				hPosRangeRightSecX = hPosRange.rightSecX,
				hPosRangeY = hPosRange.y,
				vPosRangeTopY = vPosRange.topY,
				vPosRangeX = vPosRange.x,

				// 存储在上层区域的图片信息
				imgsArrangeTopArr = [],
				topImgNum = Math.floor(Math.random()*2), // 取一个或者不取
				topImgSpliceIndex = 0,

				// 存储居中图片的状态信息
				imgsArrangeCenterArr = imgsArrangeArr.splice(centerIndex, 1);

				// 首先居中centerindex的图片, 居中的centerindex的图片不需要旋转
				imgsArrangeCenterArr[0] = {
					pos: centerPos,
					rotate: 0,
					isCenter: true
				}

				// 取出要布局上侧的图片的状态信息
				topImgSpliceIndex = Math.ceil(Math.random(imgsArrangeArr.length - topImgNum));
				imgsArrangeTopArr = imgsArrangeArr.splice(topImgSpliceIndex, topImgNum);

				// 布局位于上侧的图片
				imgsArrangeTopArr.forEach(function(value, index) {
					imgsArrangeTopArr[index] = {
						pos: {
							top: getRangeRandom(vPosRangeTopY[0], vPosRangeTopY[1]),
							left: getRangeRandom(vPosRangeX[0], vPosRangeX[1])
						},
						rotate: get30DegRandom(),
						isCenter: false
					}
				});

				// 布局左右两侧的图片
				for (let i = 0, j = imgsArrangeArr.length, k = j/2; i < j; i ++) {
					let hPosRangeLORX = null;

					// 前半部分布局左边，有半部分布局右边
					if (i < k) {
						hPosRangeLORX = hPosRangeLeftSecX;
					} else {
						hPosRangeLORX = hPosRangeRightSecX;
					}

					imgsArrangeArr[i] = {
						pos: {
							top: getRangeRandom(hPosRangeY[0], hPosRangeY[1]),
							left: getRangeRandom(hPosRangeLORX[0], hPosRangeLORX[1])
						},
						rotate: get30DegRandom(),
						isCenter: false
					}
				}

				if (imgsArrangeTopArr && imgsArrangeTopArr[0]) {
					imgsArrangeArr.splice(topImgSpliceIndex, 0, imgsArrangeTopArr[0]);
				}

				imgsArrangeArr.splice(centerIndex, 0, imgsArrangeCenterArr[0]);

				this.setState({
					imgsArrangeArr: imgsArrangeArr
				});
	}

	/*
	 * 利用rearrange函数，居中对应index的图片
	 * @param index 需要被居中的图片对应的图片信息数组的index值
	 * @return {function}
	 */
	center(index) {
		return function() {
			this.rearrange(index);
		}.bind(this);
	}

	// 组件加载后，为每张图片计算其位置的范围
	componentDidMount() {
		// 获取舞台的大小
		var stageDom = ReactDOM.findDOMNode(this.refs.stage),
				stageW = stageDom.scrollWidth,	// 对象的实际内容的宽度（不包含滚动条等区域，随对象内容超过可视区域变大）
				stageH = stageDom.scrollHeight,
				halfStageW = Math.ceil(stageW/2),	// 保证为整数
				halfStageH = Math.ceil(stageH/2);

		// 获得ImgFigure的大小
		var imgFigureDom = ReactDOM.findDOMNode(this.refs.imgFigure0),
				imgW = imgFigureDom.scrollWidth,
				imgH = imgFigureDom.scrollHeight,
				halfImgW = Math.ceil(imgW/2),	// 保证为整数
				halfImgH = Math.ceil(imgH/2);

		// 计算constant的值
		// 计算中心图片的位置点
		this.Constant.centerPos = {
			left: halfStageW - halfImgW,
			top: halfStageH - halfImgH
		}

		// 计算左侧、右侧区域的xy取值范围
		this.Constant.hPosRange.leftSecX[0] = -halfImgW;
		this.Constant.hPosRange.leftSecX[1] = halfStageW - halfImgW*3;
		this.Constant.hPosRange.rightSecX[0] = halfStageW + halfImgW;
		this.Constant.hPosRange.rightSecX[1] = stageW - halfImgW;
		this.Constant.hPosRange.y[0] = -halfImgW;
		this.Constant.hPosRange.y[1] = stageH - halfImgW;
		// 计算上侧区域图片排布位置的取值范围
		this.Constant.vPosRange.topY[0] = -halfImgH;
		this.Constant.vPosRange.topY[1] = halfStageH - halfImgH*3;
		this.Constant.vPosRange.x[0] = halfStageW - imgW;
		this.Constant.vPosRange.x[1] = halfStageW;

		// 指定第一张图片居中
		this.rearrange(0);
	}
  render() {
		var controllerUnits = [],
			ImgFigures = [];

		imagesDates.forEach(function(value,index) {
			if(!this.state.imgsArrangeArr[index]) { // 初始化状态对象
				this.state.imgsArrangeArr[index] = {
					pos: {
						left: 0,
						top: 0
					},
					rotate: 0,
					isInverse: false,
					isCenter: false
				}
			}
			ImgFigures.push(<ImgFigure key={'img'+index} data={value} ref={'imgFigure' + index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/>);
			
			controllerUnits.push(<ControllerUnit key={index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/>);
		}.bind(this));

    return (
      <section className="stage" ref="stage">
      	<section className="img-sec">
      		{ImgFigures}
      	</section>
      	<nav className="controller-nav">
      		{controllerUnits}
      	</nav>
      </section>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
