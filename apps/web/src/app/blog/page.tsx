/**
 * @fileMetadata
 * @purpose "Serves as the foundation for the Florida property and insurance content blog."
 * @dependencies []
 * @owner content-team
 * @status foundation
 */
/**
 * @fileMetadata
 * @purpose "Blog page foundation for Florida property and insurance content"
 * @owner content-team
 * @dependencies ["react"]
 * @exports ["BlogPage"]
 * @complexity low
 * @tags ["blog", "content", "florida"]
 * @status foundation
 */

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Florida Property</span>
            <span className="block mt-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Intelligence Blog
            </span>
          </h1>

          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Expert insights on Florida property management, insurance optimization, and wealth building strategies.
          </p>

          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
            <p className="text-gray-400">
              Our blog is currently under development. We'll be sharing valuable content about:
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6 text-left">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Florida insurance insights
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Property maintenance tips
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  Hurricane preparation guides
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Wealth building strategies
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Digital twin case studies
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  Community success stories
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
