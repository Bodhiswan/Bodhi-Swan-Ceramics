/**
 * Vanilla JS TiltedCard Component
 * Based on the React Bits tilted card component
 * Provides smooth 3D tilt effects on mouse interaction
 */

class TiltedCard {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      rotateAmplitude: options.rotateAmplitude || 14,
      scaleOnHover: options.scaleOnHover || 1.1,
      showTooltip: options.showTooltip !== false,
      containerHeight: options.containerHeight || '300px',
      containerWidth: options.containerWidth || '300px',
      imageHeight: options.imageHeight || '300px',
      imageWidth: options.imageWidth || '300px',
      captionText: options.captionText || '',
      overlayContent: options.overlayContent || null,
      displayOverlayContent: options.displayOverlayContent || false,
      ...options
    };

    this.springValues = {
      damping: 30,
      stiffness: 100,
      mass: 2,
    };

    this.state = {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      opacity: 0,
      x: 0,
      y: 0,
      rotateFigcaption: 0,
      lastY: 0
    };

    this.animations = {
      rotateX: null,
      rotateY: null,
      scale: null,
      opacity: null,
      rotateFigcaption: null
    };

    this.init();
  }

  init() {
    this.setupStructure();
    this.bindEvents();
    this.setupAnimations();
  }

  setupStructure() {
    // Set up the main container
    this.element.style.position = 'relative';
    this.element.style.width = this.options.containerWidth;
    this.element.style.height = this.options.containerHeight;
    this.element.style.perspective = '800px';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'center';
    this.element.style.justifyContent = 'center';
    this.element.classList.add('tilted-card-figure');

    // Find or create the inner container
    this.inner = this.element.querySelector('.tilted-card-inner') || 
                 this.createInnerContainer();
    
    // Find the image
    this.image = this.element.querySelector('img');
    if (this.image) {
      this.setupImage();
    }

    // Create tooltip if enabled
    if (this.options.showTooltip && this.options.captionText) {
      this.createTooltip();
    }

    // Create overlay if enabled
    if (this.options.displayOverlayContent && this.options.overlayContent) {
      this.createOverlay();
    }
  }

  createInnerContainer() {
    const inner = document.createElement('div');
    inner.className = 'tilted-card-inner';
    inner.style.position = 'relative';
    inner.style.transformStyle = 'preserve-3d';
    inner.style.width = this.options.imageWidth;
    inner.style.height = this.options.imageHeight;
    
    // Move existing image into inner container
    if (this.image) {
      this.element.removeChild(this.image);
      inner.appendChild(this.image);
    }
    
    this.element.appendChild(inner);
    return inner;
  }

  setupImage() {
    this.image.style.width = this.options.imageWidth;
    this.image.style.height = this.options.imageHeight;
    this.image.style.objectFit = 'cover';
    this.image.style.borderRadius = '15px';
    this.image.style.willChange = 'transform';
    this.image.style.transform = 'translateZ(0)';
    this.image.style.position = 'absolute';
    this.image.style.top = '0';
    this.image.style.left = '0';
    this.image.classList.add('tilted-card-img');
  }

  createTooltip() {
    this.tooltip = document.createElement('figcaption');
    this.tooltip.className = 'tilted-card-caption';
    this.tooltip.textContent = this.options.captionText;
    this.tooltip.style.cssText = `
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      border-radius: 4px;
      background-color: #fff;
      padding: 4px 10px;
      font-size: 10px;
      color: #2d2d2d;
      opacity: 0;
      z-index: 3;
      transition: opacity 0.3s ease;
    `;
    this.element.appendChild(this.tooltip);
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tilted-card-overlay';
    this.overlay.innerHTML = this.options.overlayContent;
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      will-change: transform;
      transform: translateZ(30px);
    `;
    this.inner.appendChild(this.overlay);
  }

  bindEvents() {
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  setupAnimations() {
    // Create smooth spring animations using requestAnimationFrame
    this.startAnimationLoop();
  }

  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -this.options.rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * this.options.rotateAmplitude;

    // Set target values for smooth animation
    this.targetState = {
      rotateX: rotationX,
      rotateY: rotationY,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Calculate figcaption rotation based on mouse velocity
    if (this.tooltip) {
      const velocityY = offsetY - this.state.lastY;
      this.targetState.rotateFigcaption = -velocityY * 0.6;
      this.state.lastY = offsetY;
    }
  }

  handleMouseEnter() {
    this.targetState = {
      ...this.targetState,
      scale: this.options.scaleOnHover,
      opacity: 1
    };
  }

  handleMouseLeave() {
    this.targetState = {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      opacity: 0,
      rotateFigcaption: 0
    };
  }

  startAnimationLoop() {
    this.targetState = { ...this.state };
    
    const animate = () => {
      this.updateAnimations();
      this.applyTransforms();
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }

  updateAnimations() {
    // Spring animation simulation
    const springStrength = 0.1;
    const damping = 0.8;

    Object.keys(this.targetState).forEach(key => {
      if (typeof this.targetState[key] === 'number' && typeof this.state[key] === 'number') {
        const diff = this.targetState[key] - this.state[key];
        this.state[key] += diff * springStrength;
        this.state[key] *= damping;
      }
    });
  }

  applyTransforms() {
    // Apply transforms to the inner container
    if (this.inner) {
      this.inner.style.transform = `
        rotateX(${this.state.rotateX}deg) 
        rotateY(${this.state.rotateY}deg) 
        scale(${this.state.scale})
      `;
    }

    // Apply tooltip positioning and rotation
    if (this.tooltip) {
      this.tooltip.style.transform = `
        translateX(${this.state.x}px) 
        translateY(${this.state.y}px) 
        rotate(${this.state.rotateFigcaption}deg)
      `;
      this.tooltip.style.opacity = this.state.opacity;
    }
  }

  // Static method to initialize all tilted cards on the page
  static initAll(selector = '.tilted-card', options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach(element => {
      // Get options from data attributes
      const dataOptions = {};
      Object.keys(options).forEach(key => {
        const dataKey = `data-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
        if (element.hasAttribute(dataKey)) {
          let value = element.getAttribute(dataKey);
          // Convert string values to appropriate types
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (!isNaN(value) && value !== '') value = Number(value);
          dataOptions[key] = value;
        }
      });

      const finalOptions = { ...options, ...dataOptions };
      instances.push(new TiltedCard(element, finalOptions));
    });
    
    return instances;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  TiltedCard.initAll();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TiltedCard;
}

// Global window assignment for script tag usage
if (typeof window !== 'undefined') {
  window.TiltedCard = TiltedCard;
}