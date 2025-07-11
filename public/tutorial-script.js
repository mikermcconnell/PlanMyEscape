// Simple Landing Page Manager
class LandingManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAnimations();
        console.log('PlanMyEscape Landing Page initialized');
    }

    setupEventListeners() {
        // Add hover effects and animations
        this.setupInteractiveElements();
    }

    setupInteractiveElements() {
        // Add hover effects to stat items
        document.querySelectorAll('.stat-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-10px) scale(1.05)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(-5px) scale(1)';
            });
        });

        // Add hover effects to feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
                card.style.boxShadow = '0 20px 40px rgba(34, 139, 34, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            });
        });

        // Add click effects to buttons
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.left = `${e.offsetX}px`;
                ripple.style.top = `${e.offsetY}px`;
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    startAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            observer.observe(card);
        });

        // Observe sections
        document.querySelectorAll('.features-section, .final-cta').forEach(section => {
            observer.observe(section);
        });
    }

    launchApp() {
        // Show loading animation
        const button = event.target.closest('.cta-button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Launching...</span>';
        button.disabled = true;
        
        // Redirect to main app after brief delay
        setTimeout(() => {
            // Redirect to the main React app (same server)
            window.location.href = '/'; // This will redirect to the main PlanMyEscape app
        }, 1500);
    }

    learnMore() {
        // Smooth scroll to features section
        const featuresSection = document.querySelector('.features-section');
        if (featuresSection) {
            featuresSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Initialize landing page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.landingManager = new LandingManager();
    console.log('Landing page loaded successfully');
});

// Global functions for onclick handlers
function launchApp() {
    window.landingManager.launchApp();
}

function learnMore() {
    window.landingManager.learnMore();
}

// Add CSS for animations and effects
const landingCSS = `
/* Ripple effect for buttons */
.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
}

@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

/* Fade in animation */
.animate-in {
    animation: fadeInUp 0.8s ease forwards;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Feature card hover effects */
.feature-card {
    transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
    transform: scale(1.1);
    color: #32CD32;
}

/* Button loading state */
.cta-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.cta-button .fa-spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = landingCSS;
document.head.appendChild(style); 