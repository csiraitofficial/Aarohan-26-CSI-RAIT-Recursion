import React from 'react'
import {
  CalendarIcon,
  ChevronRight,
  Menu,
  Bell,
  MessageSquareText,
  ShoppingCart,
  Calculator,
  Building2,
  Lock,
  FileCheck
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"

export default function HealixLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
 
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const features = [
    {
      icon: Bell,
      title: "Medicine Reminder",
      description: "Never miss a dose with our smart medicine reminder system powered by Firebase Cloud Messaging. Get real-time notifications and track your medication schedule effortlessly.",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: MessageSquareText,
      title: "MediChat AI Doctor",
      description: "Experience personalized healthcare guidance with our AI-powered chat system. Using advanced RAG approach with your health records context for more accurate consultations.",
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: ShoppingCart,
      title: "Medicine Price Comparison",
      description: "Find the best deals on medications by comparing prices across multiple online pharmacies. Save money while ensuring you get authentic medicines.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Calculator,
      title: "Insurance Premium Predictor",
      description: "Get accurate insurance premium estimates based on your medical history using our advanced ML model. Make informed decisions about your healthcare coverage.",
      gradient: "from-red-500 to-red-600"
    },
    {
      icon: Building2,
      title: "Healthcare Services Finder",
      description: "Discover nearby specialists, clinics, labs, and healthcare facilities. Compare services and read verified reviews from trusted patients.",
      gradient: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Lock,
      title: "Secure Login",
      description: "Your account is protected with enterprise-grade security. Multi-factor authentication and encrypted data transmission ensure your information stays private.",
      gradient: "from-teal-500 to-teal-600"
    },
    {
      icon: FileCheck,
      title: "Health Records",
      description: "Store and access your complete medical history, test results, and prescriptions in one secure place. Share records with healthcare providers when needed.",
      gradient: "from-indigo-500 to-indigo-600"
    },
    {
      icon: CalendarIcon,
      title: "Easy Appointments",
      description: "Book, reschedule, or cancel appointments with healthcare providers through NexHealth integration. Get reminders and manage your medical visits effortlessly.",
      gradient: "from-pink-500 to-pink-600"
    }
  ];

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full animated-gradient">
      <motion.header 
        className="w-full px-4 md:px-8 py-6 flex justify-between items-center bg-white bg-opacity-80 backdrop-blur-md fixed top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img
            src="/healix-logo.svg"
            alt="Healix logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-bold text-blue-800">Healix</span>
        </motion.div>
        <nav className="hidden md:block">
  <motion.ul 
    className="flex space-x-6 items-center"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
  >
    <motion.li variants={itemVariants}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          variant="ghost" 
          onClick={handleScrollToFeatures} 
          className="bg-transparent text-gray-600 hover:text-blue-500 hover:bg-transparent shadow-none"
        >
          Features
        </Button>
      </motion.div>
    </motion.li>
  </motion.ul>
</nav>

        <motion.div 
          className="md:hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu className="h-6 w-6" />
          </Button>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-white shadow-lg fixed top-16 left-0 right-0 z-40"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="w-full px-4 md:px-8 py-4">
              <motion.ul 
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.li variants={itemVariants}>

                  <button
                    onClick={handleScrollToFeatures}
                    className="block py-2 text-gray-600 hover:text-blue-500 w-full text-left"
                  >
                    Features
                  </button>
                </motion.li>
              </motion.ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        <motion.section 
          className="w-full px-4 md:px-8 py-12 md:py-20 text-center"
          style={{ opacity, scale }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-blue-800 mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Complete Healthcare Companion
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Experience healthcare reimagined with AI-powered assistance, secure medical records storage, and integrated appointment booking. From finding the best medicine prices to connecting with healthcare providers, Healix is your all-in-one healthcare solution.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
               <Link to={'/auth'}>
             
              <Button className="text-lg px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300">

              Get Started by Signing in
                
                 <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        <section
          id="features-section"
          className="w-full px-4 md:px-8 py-12 md:py-20"
        >
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center text-blue-800 mb-8 md:mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Innovative Features for Modern Healthcare
          </motion.h2>
          <motion.div 
            className="flex flex-wrap justify-center gap-6 md:gap-8 w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.03,
                  transition: { duration: 0.2 }
                }}
              >
                <motion.div 
                  className={`w-14 h-14 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section 
          className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 md:py-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full px-4 md:px-8 text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Transform Your Healthcare Experience
            </motion.h2>
            <motion.p
              className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Join thousands of users who have already discovered a smarter way to manage their health.
              With AI-powered assistance and comprehensive tools, taking control of your healthcare has never been easier.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={'/auth'}>
                <Button variant="secondary" className="text-lg px-8 py-4 bg-white text-blue-800 hover:bg-blue-100 transition-all duration-300">
                  Sign in Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

      </main>

      <motion.footer 
        className="w-full bg-blue-900 text-white py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-3">
                <img
                  src="/healix-logo.svg"
                  alt="Healix logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-2xl font-bold">Healix</span>
              </div>
              <p className="mt-4 text-blue-200">Revolutionizing healthcare management with AI-powered solutions and comprehensive health services.</p>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <nav>
                <ul className="space-y-2">
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      Features
                    </motion.a>
                  </li>
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      About Us
                    </motion.a>
                  </li>
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      Contact
                    </motion.a>
                  </li>
                </ul>
              </nav>
            </motion.div>
            <motion.div variants={itemVariants}>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <nav>
                <ul className="space-y-2">
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      Privacy Policy
                    </motion.a>
                  </li>
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      Terms of Service
                    </motion.a>
                  </li>
                  <li>
                    <motion.a 
                      href="#" 
                      className="text-blue-200 hover:text-white transition-colors"
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      Cookie Policy
                    </motion.a>
                  </li>
                </ul>
              </nav>
            </motion.div>
          </motion.div>
          <motion.div 
            className="mt-12 pt-8 border-t border-blue-800 text-center text-blue-200"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p>&copy; 2025 Healix. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
